# Olive Path

Build a premium, production-ready Subscription + Lead Management Web Application with a highly polished SaaS-style UI.

The entire website must feel premium, trustworthy, modern, financial-services oriented, and high-value, not like a basic template.

1. BRANDING & DESIGN SYSTEM

Primary Color Theme

Use:

Primary: Olive Green

Secondary: Lime Green

Supporting shades: Dark Olive Green, Medium Olive Green

Background: Very Light Cream / Warm Cream

Cards: White / Soft Cream

Text: Dark Olive / Charcoal

Accent: Lime Green

Suggested color palette:

Dark Olive: #3F4F24

Olive Green: #728C3A

Light Olive: #91A84B

Lime Green: #B7D94C

Cream: #F8F5E9

Soft Cream: #FCFAF2

White: #FFFFFF

Dark Text: #22251B

The design should use much more Olive Green than Cream.

Cream should mainly be used as a soft background/supporting color.

Visual Style

Create a premium visual experience similar to a high-end financial/technology subscription platform.

Use:

Premium gradients

Glassmorphism where appropriate

Soft shadows

Rounded cards

Elegant borders

Subtle animations

Hover effects

Smooth transitions

Premium icons

Large typography

Strong CTA buttons

Clean spacing

Responsive design

Mobile-first layout

Desktop dashboard layout

Do NOT make the UI look crowded.

2. HERO SECTION

Create a premium hero section.

Headline:

Unlock Premium Access. Unlock Better Opportunities.

Subheadline:

Choose your subscription plan and unlock exclusive discounts, business opportunities, loan profiles, premium leads and powerful business resources.

Primary CTA:

Explore Plans

Secondary CTA:

View Available Opportunities

Hero background should have subtle visual elements related to:

Business

Loans

Digital Marketing

Software

Financial services

Business networking

Lead generation

Data analytics

Use abstract premium illustrations/cards instead of random stock images.

Add floating statistic cards:

6,00,000+ Business Contacts

1,00,000+ Loan Profiles

1,000+ Daily Enquiries

Limited Premium Slots

Important:

Any currently hardcoded demo statistics/data must be clearly marked as configurable/admin-managed content.

3. SERVICE BENEFITS SECTION

Create a section:

Everything You Need in One Subscription

Display premium service cards for:

Loan Services

Personal Loans

Business Loans

Home Loans

Vehicle Loans

Education Loans

Working Capital

MSME Loans

Other Loan Categories

Documentation Services

Marriage Registration

Land Survey

Documentation Services

Registration Assistance

Other documentation services

Digital Marketing

Website Development

SEO

Social Media Marketing

Graphic Design

Video Editing

Reels Creation

Google Ads

Meta Ads

WhatsApp Marketing

Software Services

Billing Software

Accounting Software

HR Software

Business Management Software

Custom Software

Each service should show:

Service name

Short description

Original price

Subscription discount

Final member price

CTA

Discount must automatically calculate based on the user's active subscription plan.

4. SUBSCRIPTION PLANS

Create a premium pricing section.

Plans:

PLAN 1 – STARTER

Price:

₹1/day

Monthly subscription charge:

₹30/month

Benefits:

Flat 25% discount across eligible services

Access to selected subscription benefits

Up to 10 lead allocations per month

Member dashboard

Subscription management

Access to eligible opportunities

Member-only offers

CTA:

Start for ₹1

Important:

The ₹1/day wording is marketing display.

Actual monthly subscription charge should be configurable from Admin.

Default:

₹30/month.

5. PLAN 2 – BUSINESS

Price:

₹10/day

Monthly subscription:

₹300/month

Benefits:

Flat 50% discount on eligible services

500 available lead/data slots

Access to eligible loan profiles

Access to business contacts

Access to selected B2B opportunities

Direct contact/action options where permitted

Member dashboard

Subscription management

Advance-month access option

Availability:

Only 500 slots

Display:

457 / 500 Slots Available

The slot counter must be dynamic.

Once all 500 slots are occupied:

Show:

LIMIT REACHED

and disable the normal subscription purchase button.

Instead show:

Contact Us for Availability

Contact:

95559155535

Make this number configurable from Admin Settings.

6. PLAN 3 – PREMIUM

Price:

₹100/day

Monthly equivalent:

₹3,000/month

Annual calculation:

₹100 × 365 days = ₹36,500/year.

Allow Admin to configure whether the customer pays:

Monthly

Quarterly

Annual

Benefits:

Flat 75% discount on eligible services

Premium loan profiles

Premium business opportunities

Higher-priority lead access

Direct lead access where permitted

Premium member dashboard

Advanced lead management

Premium resources

Availability:

Only 100 Premium Slots

Display:

87 / 100 Slots Available

Once 100 slots are occupied:

Disable purchase.

Show:

Premium Slots Full

CTA:

Contact Us

7. BANK EXECUTIVE SUBSCRIPTION

Create a separate section:

Bank Executive Plans

Only these plans are available for Bank Executives:

₹10 Plan

₹100 Premium Plan

Do NOT show the ₹1 plan inside the Bank Executive portal.

Bank Executive access must require:

Unique User ID

Password

Secure Login

Profile

Employee/Executive status

Subscription status

Admin can approve/reject Bank Executive accounts.

8. BANK EXECUTIVE PREMIUM ACCESS

For eligible Premium Bank Executive users, create a separate premium dashboard.

Dashboard sections:

Customer Leads

Show:

Customer Name

Contact Number

Location

Loan Requirement

Loan Type

Estimated Requirement

Lead Status

Assigned Date

Lead ID

Important:

Do not expose real personal data in demo mode.

Use clearly marked:

DEMO DATA – NOT REAL CUSTOMER INFORMATION

Admin will later replace demo records with legitimate backend/imported records.

9. LEAD ALLOCATION SYSTEM

This is one of the most important features.

Every lead must have a unique Lead ID.

Example:

LEAD-000001

Each lead has:

Lead ID

Customer Name

Contact Number

Location

Loan Type

Requirement

Status

Assigned Executive

Assigned Date

Subscription

Usage status

One-Time Allocation Rule

When a lead is assigned to an employee/executive:

That lead becomes permanently unavailable to that same employee for future allocation.

The system must maintain a:

Lead Allocation History

Before assigning a lead, check:

Has this lead already been assigned to this user?

If YES → never assign again.

If NO → it can be assigned.

The same lead MAY be assigned to another eligible executive according to Admin rules.

10. STARTER PLAN LEAD LIMIT

₹1 Plan users:

Maximum:

10 leads per subscription period

After 10 leads:

Show:

Monthly Lead Limit Reached

Disable further lead grabbing.

Do not reset consumed leads incorrectly.

The system must track:

Total allocated

Total remaining

Used leads

Remaining leads

11. BUSINESS PLAN SLOT SYSTEM

₹10 Plan:

Maximum available subscription slots:

500 users

The system must automatically count:

Total slots

Occupied slots

Remaining slots

Example:

500 total
492 occupied
8 remaining

Display:

Only 8 Slots Remaining

When remaining slots = 0:

Automatically disable registration.

12. PREMIUM PLAN SLOT SYSTEM

₹100 Plan:

Maximum:

100 users

Show live availability.

Example:

Only 14 Premium Slots Left

When full:

Disable purchase.

Admin can increase/decrease the slot limit.

13. WEEKLY LEAD ATTEMPT SYSTEM

Create a lead claiming system.

For eligible plans:

User can make only one lead claiming attempt per week, based on Admin-configured plan rules.

Example:

Weekly allocation:

10 leads

Attempts:

1 per week

After the weekly attempt is completed:

Show:

Weekly Lead Attempt Used

Countdown:

Next Attempt Available In: 5 Days 8 Hours

Admin must be able to configure:

Leads per attempt

Attempts per week

Attempt reset day

Plan eligibility

14. ADVANCE MONTH ACCESS

Create:

Advance Access

Users can pay for the upcoming subscription period in advance.

Example:

Current month:
October

Advance month:
November

Show:

Unlock November Lead Access in Advance

User can:

Select upcoming month

View available allocation

Pay in advance

Reserve eligible future access

The system must never allocate the same lead twice to the same executive.

15. SUBSCRIPTION BILLING

Subscription billing must support:

₹1 Plan

₹30/month

₹10 Plan

₹300/month

₹100 Plan

₹3,000/month

Annual ₹100 plan:

₹36,500/year based on ₹100/day.

However, make pricing fully configurable through Admin.

16. RAZORPAY INTEGRATION

Prepare the application for Razorpay Subscription / Recurring Payment integration.

Do not hardcode secret keys.

Create Admin Settings:

Razorpay Key ID

Razorpay Secret Key

Webhook Secret

Test Mode

Live Mode

Use environment variables for secrets.

Create backend architecture for:

Customer creation

Subscription creation

Payment verification

Subscription activation

Recurring payment

Payment success

Payment failure

Subscription cancellation

Subscription pause if supported

Webhook processing

Invoice/payment history

The subscription status should automatically update after verified Razorpay webhook events.

Possible statuses:

Pending

Active

Payment Failed

Paused

Cancelled

Expired

IMPORTANT:

Do not store Razorpay secret keys in frontend code.

17. AUTO-PAY

When a user subscribes:

Display clearly:

Recurring Payment Enabled

Example:

₹300/month

After successful subscription setup, future recurring payments should be handled through Razorpay's supported subscription/recurring-payment mechanism.

Users must be able to:

View subscription

View next billing date

View payment history

Cancel subscription

See current plan

See renewal amount

Do NOT implement fake payment success.

Use Razorpay's actual payment verification/webhook flow once credentials are configured.

18. GST CALCULATION

Create configurable GST settings.

Default GST:

18%

Admin can change GST percentage.

Every payment should display:

Base Amount

GST

Application Fee

Discount

Final Payable Amount

Example:

Base subscription = ₹300

GST = 18%

GST amount = ₹54

Application Fee = ₹99

Total = ₹453

All calculations must be automatic.

Do not hardcode the final total.

19. APPLICATION FEE

Add:

Application / Registration Fee: ₹99

This must be configurable from Admin.

Admin can:

Enable/disable

Change amount

Apply to selected plans

Apply only during first payment

20. DECEMBER OFFER

Create a special offer system.

Offer:

10% OFF

Applicable:

December only

The offer must automatically activate only when the current date falls inside the configured December campaign period.

Do NOT show this offer in other months.

Admin should be able to configure:

Start date

End date

Discount %

Eligible plans

Display:

December Exclusive – Save 10% on Annual Plan

21. LOAN CLIENT SPECIAL OFFER

Create a promotional section:

Special Subscription for Loan Clients

Headline:

One of the Best Subscription Plans for Loan Clients

Offer:

33% OFF for First Month

First month:

₹99 + GST

Next month:

₹10 + GST

Add:

Advance Payable Mode Available

CTA:

Get Started

All pricing should be controlled from Admin.

22. LOAN PROFILE DATABASE

Create a premium searchable loan profile interface.

Categories:

Personal Loan

Business Loan

Home Loan

Vehicle Loan

Education Loan

MSME Loan

Working Capital

Mortgage Loan

Loan Against Property

Other Loan Categories

Each profile may contain:

Profile ID

Name

Location

Contact

Loan Type

Requirement

Estimated Amount

Eligibility status

Lead status

Created date

IMPORTANT:

For initial UI/demo, use synthetic records only.

Every demo record must display:

DEMO / SAMPLE DATA

Do not represent demo records as genuine customer leads.

Admin can later import legitimate data through:

CSV

Excel

Manual entry

API

23. BUSINESS CONTACT DATABASE

Create:

Business Contact Directory

Show dashboard statistics such as:

6,00,000+ business contacts

Kanyakumari business directory

B2B opportunities

Business categories

Location

Contact availability

These numbers must be editable from Admin.

Do not hardcode them permanently.

Create filters:

Business Category

Location

District

Business Type

Availability

Status

24. CONTACT ACCESS CONTROL

Do NOT automatically expose unlimited customer contact numbers.

Access must depend on:

Subscription plan

User role

Lead allocation

Lead usage

Admin permission

Every contact access must be logged.

Create:

Contact Access History

Fields:

User

Lead ID

Date

Time

Action

Plan

Status

25. USER DASHBOARD

Create a premium dashboard.

Show:

Subscription

Current Plan

Status

Renewal Date

Next Payment

Remaining Days

Cancel Subscription

Lead Usage

Example:

10 / 10 Leads Used

Progress bar.

Weekly Attempt

Example:

1 / 1 Attempt Used

Available Opportunities

Loan Profiles

Business Contacts

Service Discounts

Premium Offers

Discount

Example:

25% Member Discount Active

26. ADMIN DASHBOARD

Create a complete Admin Portal.

Dashboard statistics:

Total Users

Active Subscribers

₹1 Subscribers

₹10 Subscribers

₹100 Subscribers

Bank Executives

Active Premium Users

Available Slots

Used Slots

Total Leads

Assigned Leads

Unassigned Leads

Payment Revenue

Failed Payments

Cancelled Subscriptions

Daily Enquiries

27. ADMIN USER MANAGEMENT

Admin can:

Create user

Edit user

Suspend user

Activate user

Delete user

Change plan

View subscription

View payment history

View lead usage

Reset eligible limits

Assign role

Roles:

Super Admin

Admin

Customer

Bank Executive

Premium Bank Executive

28. ADMIN LEAD MANAGEMENT

Admin can:

Add lead

Import leads

Edit lead

Delete lead

Assign lead

Reassign lead

Search lead

Filter lead

View allocation history

View contact access history

Lead assignment engine must automatically check duplicate allocation history.

29. AUTOMATIC LEAD ALLOCATION

Create an allocation engine.

When a user requests a lead:

Verify subscription is active.

Verify plan eligibility.

Verify remaining lead quota.

Verify weekly attempt availability.

Search eligible unallocated-to-this-user leads.

Select a valid lead.

Assign lead.

Record allocation history.

Reduce remaining quota.

Show lead to user.

Prevent the same lead from being allocated again to that user.

If no eligible lead exists:

Show:

No New Matching Leads Available

30. NOTIFICATION SYSTEM

Create notifications for:

Subscription activated

Payment successful

Payment failed

Subscription renewal

Subscription cancelled

Weekly lead attempt available

Weekly attempt used

Lead allocated

Lead limit reached

Premium slots running low

Subscription expiry

Advance access activated

Admin notification:

When ₹10 plan reaches 500 users:

Business Plan Capacity Reached

When ₹100 plan reaches 100 users:

Premium Plan Capacity Reached

31. CONTACT US

Create a strong CTA section:

Need More Access?

Text:

Our premium plans are limited. Contact our team for additional availability and business access.

Phone:

95559155535

Buttons:

Call Now

Contact Support

Make contact details configurable from Admin.

32. RESPONSIVE DESIGN

The entire website must work perfectly on:

Desktop

Laptop

Tablet

Android

iPhone

Mobile UI should have:

Bottom navigation where useful

Sticky CTA

Compact cards

Easy subscription purchase

Simple lead access

Mobile-friendly dashboard

33. REQUIRED PAGES

Create:

Home

Subscription Plans

Loan Opportunities

Business Contacts

Services

Offers

Login

Register

Customer Dashboard

Bank Executive Login

Bank Executive Dashboard

Premium Dashboard

Subscription Management

Payment History

Lead History

Profile

Contact Us

Terms & Conditions

Privacy Policy

Refund/Cancellation Policy

Admin Login

Admin Dashboard

34. SECURITY

Implement:

Authentication

Role-based access control

Protected routes

Backend authorization

Server-side subscription validation

Server-side lead quota validation

Secure payment verification

Razorpay webhook verification

Rate limiting where appropriate

Audit logs

No secret keys in frontend

No unauthorized contact access

Never trust frontend values for:

Subscription status

Lead count

Payment status

Discount

GST

Slot availability

User role

All critical calculations and permissions must be verified server-side.

35. DATABASE STRUCTURE

Create database tables/models for:

users

id

name

email

phone

password/auth reference

role

status

created_at

plans

id

name

price

billing_period

discount_percentage

lead_limit

weekly_attempt_limit

slot_limit

active

subscriptions

id

user_id

plan_id

razorpay_subscription_id

status

start_date

renewal_date

cancellation_date

payments

id

user_id

subscription_id

base_amount

discount

gst

application_fee

total_amount

razorpay_payment_id

status

paid_at

leads

id

lead_id

name

phone

location

loan_type

requirement

status

source

is_demo

lead_allocations

id

lead_id

user_id

allocated_at

plan_id

status

lead_attempts

id

user_id

week_identifier

attempt_count

created_at

contact_access_logs

id

user_id

lead_id

accessed_at

action

business_contacts

id

business_name

category

location

phone

status

is_demo

offers

id

title

discount

start_date

end_date

applicable_plan

active

settings

gst_percentage

application_fee

support_phone

slot_limits

pricing

campaign settings

36. PREMIUM UX DETAILS

Add subtle premium animations:

Fade-in sections

Card hover elevation

Number counters

Progress animations

Smooth page transitions

Button micro-interactions

Skeleton loaders

Empty states

Success states

Error states

Avoid excessive animations.

The UI should feel like a premium fintech/business SaaS product.

37. SUBSCRIPTION CARD DESIGN

Each plan card should clearly display:

PLAN NAME

₹ price

Billing period

Discount

Lead access

Available slots

Benefits

CTA

Example:

BUSINESS

₹10/day

₹300/month

50% SERVICE DISCOUNT

500 Available Slots

Limited Access

CTA:

Subscribe Now

38. PREMIUM PLAN HIGHLIGHT

Make the ₹100 Premium Plan visually prominent.

Badge:

MOST EXCLUSIVE

or

PREMIUM ACCESS

Show:

Only 100 Slots

Use Olive + Lime premium gradient.

39. TRUST SECTION

Create:

Why Members Choose Us

Cards:

Exclusive Discounts

Verified/Admin-Controlled Opportunities

Limited Membership

Premium Business Access

Powerful Lead Management

Secure Subscription Payments

Do not make unsupported claims such as "guaranteed loan approval".

40. IMPORTANT BUSINESS RULES

Implement these rules exactly:

₹1 plan → ₹30 monthly default.

₹1 plan → 25% eligible service discount.

₹1 plan → maximum 10 leads per subscription period.

₹10 plan → ₹300 monthly default.

₹10 plan → 50% eligible service discount.

₹10 plan → maximum 500 total subscription slots.

₹100 plan → ₹3,000 monthly default.

₹100 plan → ₹36,500 annual equivalent at ₹100/day.

₹100 plan → 75% eligible service discount.

₹100 plan → maximum 100 premium slots.

Bank Executive portal → only ₹10 and ₹100 plans.

Bank Executive accounts require authentication.

Lead allocations must be permanently tracked.

Same lead must never be reallocated to the same executive.

Weekly attempts must be enforced server-side.

Advance-month payment must be supported.

GST must be configurable.

Application fee ₹99 must be configurable.

December annual offer → 10% discount only during configured December dates.

Razorpay must be integration-ready.

Razorpay secrets must remain server-side.

Demo customer data must never be presented as genuine data.

Real backend data can later replace demo records.

Slot counts must update automatically.

All critical calculations must be server-side.

41. DEMO MODE

Create a clearly marked:

DEMO MODE

Use synthetic sample loan profiles and business contacts.

Display a visible label:

DEMO DATA – SAMPLE RECORDS ONLY

Admin must be able to disable Demo Mode after importing legitimate data.

42. ADMIN CONFIGURATION

Everything important should be configurable without editing code:

Plan prices

Billing cycle

Discounts

GST

Application fee

Slot limits

Lead limits

Weekly attempts

Advance access

December offer

Loan client offer

Support phone

Service pricing

Service categories

Dashboard statistics

Demo mode

Razorpay configuration

Promotional banners

43. FINAL REQUIREMENT

Do not create just a static landing page.

Build this as a real full-stack subscription platform architecture with:

Premium frontend

Authentication

Database

Admin dashboard

Customer dashboard

Bank Executive dashboard

Subscription management

Lead allocation engine

Slot management

Payment architecture

Razorpay integration readiness

GST calculation

Discount engine

Notification system

Audit logs

Responsive UI

The final product should feel like a premium subscription marketplace + loan lead platform + business opportunity portal, using the Olive Green + Lime Green + Cream brand identity.

Before completing the build, test:

Registration

Login

Plan selection

Pricing calculation

GST calculation

Application fee

Discount

Slot limits

Lead limits

Weekly attempts

Duplicate lead prevention

Bank Executive restrictions

Admin controls

Subscription status

Payment states

Mobile responsiveness

Demo data labeling

Do not claim Razorpay payment is successful unless it is actually verified through the Razorpay integration/webhook flow.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://prince-group-subscription.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/92032d2e-ff07-40e9-82dd-e2202315f52f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
