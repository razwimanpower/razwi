# Enquiry delivery: email and WhatsApp

## Option A: works now (email) - already switched on
Forms post to FormSubmit (https://formsubmit.co) which emails each enquiry to razwimanpowerresources786@gmail.com.
1. Upload the site, open any form on the LIVE site and send a test enquiry.
2. FormSubmit emails an activation link to razwimanpowerresources786@gmail.com. Click it ONCE.
3. Send another test. It should arrive in that inbox.
After a successful send, the visitor sees an "Also send on WhatsApp" button (opens WhatsApp with the enquiry typed in; the visitor taps Send).
If the service is unreachable, the form falls back to the visitor's email app. A success message is shown only when delivery is confirmed.
Note: FormSubmit is a third-party processor of enquiry data. The Privacy page mentions this.

## Option B: automatic email AND automatic WhatsApp to the company (needs accounts)
Uses enquiry-worker.js (Cloudflare Worker, free tier is enough), Resend (email) and the Meta WhatsApp Business Cloud API.
1. Cloudflare: create a Worker, paste enquiry-worker.js, add variables: RESEND_API_KEY, MAIL_FROM (a verified sender in Resend), MAIL_TO, ALLOWED_ORIGIN=https://www.razwimanpower.in
2. WhatsApp: create a Meta Business account + WhatsApp Business Platform app; add the receiving number; create and get approved a message template named new_enquiry with body: "New enquiry: {{1}} from {{2}}, phone {{3}}. Details: {{4}}". Add variables WA_TOKEN (permanent token), WA_PHONE_ID, WA_TO (for example 919939550285), WA_TEMPLATE.
3. In site.js set FORM_ENDPOINT to the Worker URL.
WhatsApp Business API has Meta approval steps and per-message charges; the sending number cannot be one that is already registered on the normal WhatsApp app unless migrated.
