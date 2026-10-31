import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import { createHash, randomUUID } from 'node:crypto';

initializeApp();
setGlobalOptions({ region: 'asia-south1', maxInstances: 10 });
const db = getFirestore();
const BKASH_APP_KEY = defineSecret('BKASH_APP_KEY');
const BKASH_APP_SECRET = defineSecret('BKASH_APP_SECRET');
const BKASH_USERNAME = defineSecret('BKASH_USERNAME');
const BKASH_PASSWORD = defineSecret('BKASH_PASSWORD');
const BKASH_BASE_URL = defineSecret('BKASH_BASE_URL');
const BKASH_CALLBACK_BASE_URL = defineSecret('BKASH_CALLBACK_BASE_URL');
const isAdmin = async (uid: string) => (await db.doc(`users/${uid}`).get()).data()?.role === 'admin';
const money = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0;

// Bootstrap: first authorized phone number must be pre-added by a trusted setup script.
// This callable is intentionally admin-only after bootstrap; never trust a client-supplied role.
export const bootstrapFirstAdmin = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated','Sign in first.');
  const uid = request.auth.uid;
  const settings = db.doc('settings/bootstrap');
  return db.runTransaction(async tx => {
    const [s,u] = await Promise.all([tx.get(settings),tx.get(db.doc(`users/${uid}`))]);
    if (s.exists && s.data()?.adminUid) throw new HttpsError('failed-precondition','Admin is already initialized.');
    if (u.exists) throw new HttpsError('already-exists','User profile already exists.');
    // Initial allowed phone must be inserted by setup script into allowedPhones/{E164}.
    const phone = request.auth?.token.phone_number;
    if (!phone) throw new HttpsError('permission-denied','Verified phone number required.');
    const allowed = await tx.get(db.doc(`allowedPhones/${phone}`));
    if (!allowed.exists) throw new HttpsError('permission-denied','This phone number was not added by the committee admin/setup.');
    tx.set(db.doc(`users/${uid}`),{uid,phone,displayName:allowed.data()?.name ?? 'প্রধান অ্যাডমিন',role:'admin',volunteer:false,auditor:false,active:true,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
    tx.set(settings,{adminUid:uid,initializedAt:FieldValue.serverTimestamp()});
    tx.set(db.collection('auditLog').doc(),{actorUid:uid,action:'bootstrap_admin',entityType:'user',entityId:uid,createdAt:FieldValue.serverTimestamp()});
    return {ok:true};
  });
});

export const recordAudit = async (actorUid:string,action:string,entityType:string,entityId:string,details:Record<string,unknown>={}) => {
  await db.collection('auditLog').add({actorUid,action,entityType,entityId,details,createdAt:FieldValue.serverTimestamp()});
};

// Manual mode: creates a pending contribution/payment request. TrxID must be verified by the admin.
export const createManualPayment = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated','Sign in first.');
  const {festivalId,amount,method='bKash',month,senderNumber,trxId} = request.data ?? {};
  if (!festivalId || !money(amount) || !['bKash','Nagad','Bank','Cash'].includes(method)) throw new HttpsError('invalid-argument','Invalid payment details.');
  const fest = await db.doc(`festivals/${festivalId}`).get();
  if (!fest.exists || fest.data()?.status !== 'active') throw new HttpsError('failed-precondition','Festival is not active.');
  const uid = request.auth.uid;
  const ref = db.collection('income').doc();
  await ref.create({festivalId,type:'contribution',memberUid:uid,amount,month:month ?? new Date().toISOString().slice(0,7),method,senderNumber:senderNumber ?? null,provider:method,providerTransactionId:trxId ?? null,grossAmount:amount,fee:0,netAmount:amount,status:'pending',createdBy:uid,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  await recordAudit(uid,'create','income',ref.id,{method,amount});
  return {incomeId:ref.id,status:'pending'};
});

// Phase 2 switch: mock sandbox creates a simulated checkout URL. Live checkout is intentionally fail-closed
// until merchant credentials, callback URL, approved bKash contract and real API implementation are verified.
export const createPayment = onCall({secrets:[BKASH_APP_KEY,BKASH_APP_SECRET,BKASH_USERNAME,BKASH_PASSWORD,BKASH_BASE_URL,BKASH_CALLBACK_BASE_URL]}, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated','Sign in first.');
  const {festivalId,amount,mode='Manual',incomeType='contribution',giverName=null,feeBearer='fund'} = request.data ?? {};
  if (!festivalId || !money(amount) || !['contribution','pronami'].includes(incomeType) || !['Manual','Sandbox','Live'].includes(mode)) throw new HttpsError('invalid-argument','Invalid checkout request.');
  const festival = await db.doc(`festivals/${festivalId}`).get();
  if (!festival.exists || festival.data()?.status !== 'active') throw new HttpsError('failed-precondition','Festival is not active.');
  const uid = request.auth.uid;
  if (incomeType === 'pronami') { const u=(await db.doc(`users/${uid}`).get()).data(); if (!(u?.role==='admin'||u?.volunteer===true)) throw new HttpsError('permission-denied','Only collectors can create this online Pronami link.'); }
  const incomeRef=db.collection('income').doc();
  const paymentRef=db.collection('payments').doc(incomeRef.id);
  const invoice=incomeRef.id;
  if (mode==='Live') {
    // Do not pretend live works: actual merchant onboarding/API contract must be verified first.
    if (![BKASH_APP_KEY.value(),BKASH_APP_SECRET.value(),BKASH_USERNAME.value(),BKASH_PASSWORD.value(),BKASH_BASE_URL.value(),BKASH_CALLBACK_BASE_URL.value()].every(Boolean)) throw new HttpsError('failed-precondition','Live bKash credentials and callback URL are not configured.');
    throw new HttpsError('failed-precondition','Live checkout is deliberately disabled until the committee’s bKash merchant API contract, signature/response format and callback domain are verified. Sandbox mode is available for UI testing.');
  }
  const mockPaymentId=`MOCK-${randomUUID()}`;
  const checkoutUrl=`${BKASH_CALLBACK_BASE_URL.value() || 'https://example.invalid'}/mock-checkout?invoice=${encodeURIComponent(invoice)}&payment=${encodeURIComponent(mockPaymentId)}`;
  await db.runTransaction(async tx=>{
    tx.create(incomeRef,{festivalId,type:incomeType,memberUid:uid,giverName,amount,method:'bKash',provider:'bKash',invoiceNumber:invoice,grossAmount:amount,fee:0,netAmount:amount,status:'pending',paymentMode:mode,feeBearer,createdBy:uid,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
    tx.create(paymentRef,{festivalId,incomeId:incomeRef.id,memberUid:uid,invoiceNumber:invoice,paymentID:mockPaymentId,amount,grossAmount:amount,fee:0,netAmount:amount,provider:'bKash',mode,status:'pending',idempotencyKey:createHash('sha256').update(`${festivalId}:${uid}:${invoice}`).digest('hex'),createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  });
  await recordAudit(uid,'create','payment',paymentRef.id,{mode,amount});
  return {incomeId:incomeRef.id,paymentId:mockPaymentId,checkoutUrl,mode,status:'pending',notice:mode==='Sandbox'?'Mock checkout only; no real money is moved.':'Manual record created; admin must verify the TrxID.'};
});

// Sandbox-only callback. Live bKash callbacks must never trust query/body status; implement server-side Execute + Query first.
export const mockSandboxCallback = onRequest(async (req,res)=>{
  if (req.method!=='POST') {res.status(405).send('POST only');return;}
  const {invoice,decision}=req.body ?? {};
  if (typeof invoice!=='string'||!['success','cancel','fail'].includes(decision)) {res.status(400).send('Invalid mock callback');return;}
  const incomeRef=db.doc(`income/${invoice}`);const paymentRef=db.doc(`payments/${invoice}`);
  try {
    await db.runTransaction(async tx=>{
      const [i,p]=await Promise.all([tx.get(incomeRef),tx.get(paymentRef)]);
      if(!i.exists||!p.exists) throw new Error('Unknown invoice');
      if(p.data()?.mode!=='Sandbox') throw new Error('Sandbox callback cannot update a live/manual payment');
      if(p.data()?.status!=='pending') return; // idempotent repeated callback
      const success=decision==='success';
      tx.update(incomeRef,{status:success?'confirmed':'rejected',failureReason:success?null:`Mock ${decision}`,updatedAt:FieldValue.serverTimestamp()});
      tx.update(paymentRef,{status:success?'success':'failed',trxID:success?`MOCK-TRX-${invoice.slice(0,8)}`:null,verifiedAmount:success?p.data()?.amount:null,updatedAt:FieldValue.serverTimestamp(),verifiedAt:success?FieldValue.serverTimestamp():null});
      tx.set(db.collection('notifications').doc(),{userUid:i.data()?.memberUid,title:success?'পেমেন্ট নিশ্চিত':'পেমেন্ট সম্পন্ন হয়নি',body:success?'ডেমো পেমেন্ট নিশ্চিত হয়েছে।':'ডেমো পেমেন্ট বাতিল হয়েছে।',read:false,createdAt:FieldValue.serverTimestamp()});
    });
    res.status(200).json({ok:true,mock:true});
  } catch(e) {logger.error('Mock callback failed',e);res.status(400).json({ok:false});}
});

export const decideIncome = onCall(async request=>{
 if(!request.auth) throw new HttpsError('unauthenticated','Sign in first.');if(!(await isAdmin(request.auth.uid)))throw new HttpsError('permission-denied','Admin only.');
 const {incomeId,decision,reason=''}=request.data??{};if(!incomeId||!['confirmed','rejected'].includes(decision)||(decision==='rejected'&&!reason.trim()))throw new HttpsError('invalid-argument','Decision and rejection reason are required.');
 const ref=db.doc(`income/${incomeId}`);await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists)throw new HttpsError('not-found','Income not found.');if(snap.data()?.status!=='pending')throw new HttpsError('failed-precondition','Only pending income can be decided.');tx.update(ref,{status:decision,rejectionReason:decision==='rejected'?reason:null,decidedBy:request.auth!.uid,decidedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});tx.set(db.collection('notifications').doc(),{userUid:snap.data()?.memberUid??snap.data()?.createdBy,title:decision==='confirmed'?'পেমেন্ট নিশ্চিত':'পেমেন্ট বাতিল',body:decision==='confirmed'?'আপনার এন্ট্রি নিশ্চিত হয়েছে।':reason,read:false,createdAt:FieldValue.serverTimestamp()});});await recordAudit(request.auth.uid,decision,'income',incomeId,{reason});return {ok:true};
});

// Daily Dhaka-local reminder job: creates in-app notices for members missing current-month confirmed contribution.
export const dailyFundReminders = onSchedule({schedule:'every day 08:00',timeZone:'Asia/Dhaka'},async()=>{
 const now=new Date();const month=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit'}).format(now);const day=Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Dhaka',day:'numeric'}).format(now));
 const [users,income,festivals]=await Promise.all([db.collection('users').where('active','==',true).get(),db.collection('income').where('type','==','contribution').where('month','==',month).where('status','==','confirmed').get(),db.collection('festivals').where('status','==','active').limit(1).get()]);
 if(day<1||day>10||festivals.empty)return;const paidUids=new Set(income.docs.map(d=>d.data().memberUid).filter(Boolean));const batch=db.batch();let count=0;
 for(const u of users.docs){if(u.data().role==='admin'||paidUids.has(u.id))continue;const exists=await db.collection('notifications').where('userUid','==',u.id).where('kind','==',`monthly-${month}`).limit(1).get();if(!exists.empty)continue;batch.set(db.collection('notifications').doc(),{userUid:u.id,kind:`monthly-${month}`,title:'মাসিক চাঁদার রিমাইন্ডার',body:`${month} মাসের চাঁদা জমা দিন।`,read:false,createdAt:FieldValue.serverTimestamp()});count++;}
 if(count)await batch.commit();logger.info(`Monthly reminder notifications created: ${count}`);
});

// Festival countdown reminders and puja-day greetings; all key dates are admin-entered, never lunar-calculated.
export const festivalCalendarReminders = onSchedule({schedule:'every day 08:10',timeZone:'Asia/Dhaka'},async()=>{
 const active=await db.collection('festivals').where('status','==','active').limit(1).get();if(active.empty)return;const fest=active.docs[0];const data=fest.data();const dates=data.keyDates??{};const users=await db.collection('users').where('active','==',true).get();const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const shashthi=dates.shashthi?.toDate?.() ?? (typeof dates.shashthi==='string'?new Date(dates.shashthi):null);if(!shashthi)return;const pujaDay=shashthi.toISOString().slice(0,10);const days=Math.ceil((new Date(`${pujaDay}T00:00:00Z`).getTime()-new Date(`${today}T00:00:00Z`).getTime())/86400000);const offsets=[90,60,30,14,7,3,1];let title='',body='',kind='';
 if(offsets.includes(days)){title='পূজা আর '+days+' দিন বাকি';body=`পূজা শুরু হতে ${days} দিন বাকি।`;kind=`countdown-${fest.id}-${days}`;}else if(days===0){title='শুভ ষষ্ঠী';body='শুভ দুর্গাপূজা! সকলের জন্য রইল আন্তরিক শুভেচ্ছা।';kind=`puja-day-${fest.id}-${today}`;}else return;
 const batch=db.batch();for(const u of users.docs){const old=await db.collection('notifications').where('userUid','==',u.id).where('kind','==',kind).limit(1).get();if(old.empty)batch.set(db.collection('notifications').doc(),{userUid:u.id,kind,title,body,read:false,festivalId:fest.id,createdAt:FieldValue.serverTimestamp()});}await batch.commit();
});
