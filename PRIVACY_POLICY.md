# MineShare Privacy Policy

**Last Updated: November 13, 2025**

## Overview

MineShare is a privacy-first browser extension that empowers you to collect, own, and monetize your browsing data through blockchain technology. This privacy policy explains what data we collect, how it's used, and your rights.

## Our Privacy Principles

1. **Local-First**: All data stays on your device until you explicitly choose to export it
2. **Privacy-Preserving**: URLs are hashed with SHA-256, never stored in plain text
3. **No Sensitive Data**: We never collect passwords, form inputs, or personally identifiable information
4. **User Control**: You control exactly what data is collected with granular settings
5. **Transparent**: Open source code - you can verify everything we do

## What Data We Collect

When enabled, MineShare collects the following browsing activity data:

### Data We DO Collect:
- **Web History**: Domains and hashed URLs of pages you visit
- **Page Titles**: Titles of web pages (optional, can be disabled)
- **Time on Page**: How long you spend on each page (dwell time)
- **User Interactions**: General click events and scroll depth (not specific form interactions)
- **Navigation Patterns**: When you visit pages and how you navigate between them
- **Page Keywords**: Common words from visible page text (excluding form fields)
- **Browser Metadata**: Screen size, operating system, language preference
- **Sessions**: Grouping of related page visits

### Data We DO NOT Collect:
- ❌ **NO Passwords or Form Data**: Never collected or stored
- ❌ **NO Input Field Values**: Anything you type in forms, search boxes, or text areas
- ❌ **NO Keystroke Logging**: We don't track what you type
- ❌ **NO Clipboard Data**: Never accessed
- ❌ **NO Personal Identification**: No names, emails, addresses, phone numbers
- ❌ **NO Authentication Information**: No credentials or security questions
- ❌ **NO Content from Editable Areas**: contentEditable fields are excluded
- ❌ **NO Financial Data**: No credit cards, bank information, or payment details
- ❌ **NO Health Information**: Never collected
- ❌ **NO Precise Location**: Only coarse region from IP if relevant

## How We Protect Your Privacy

### URL Hashing
All URLs are hashed using SHA-256 cryptographic hashing before being stored locally. This means:
- We never store the actual URL like "facebook.com/yourprofile"
- We store only a cryptographic hash like "a3d8f7e2b9c1..."
- The original URL cannot be recovered from the hash
- Domain names (like "facebook.com") are stored separately for aggregation

### Protected Elements
Our content script explicitly avoids collecting any data from:
- `<input>` elements (including password, email, text fields)
- `<textarea>` elements
- `<select>` and `<option>` elements
- Any element with `contentEditable=true`

### Local Storage Only
All collected data is stored in:
- Chrome's `chrome.storage.local` API on your device
- Never sent to our servers automatically
- Never shared with any third parties
- Never uploaded to cloud services without your explicit action

## How Data Is Used

### On Your Device
- Data is aggregated per domain to show you statistics
- Displayed in the extension popup for your review
- Used to generate insights about your browsing patterns
- Stored locally until you clear it or export it

### User-Initiated Export Only
Data leaves your device ONLY when you:
1. Click the "Export to Marketplace" button in the extension
2. Confirm you want to upload data to the decentralized marketplace
3. Complete the upload to Walrus (decentralized storage) and list on Sui blockchain

### When You Export
- Data is encrypted before upload to Walrus decentralized storage
- You receive an encryption key to share with potential buyers
- Data is listed on the Sui blockchain marketplace
- Buyers pay you directly in cryptocurrency for access to your data
- **You control the sale, not us** - We never sell your data

## Data Sharing and Third Parties

### We Do NOT Share Data
- We (the extension developers) never receive your data
- We never sell or transfer your data to third parties
- We have no servers that collect your browsing data
- No analytics or tracking services receive your data

### User-Controlled Marketplace
When you export data to the marketplace:
- Data goes to Walrus (decentralized storage network)
- Listing metadata goes to Sui blockchain
- Potential buyers can purchase access from YOU
- You set the price and control access
- This is YOU selling YOUR data, not us selling your data

### Blockchain Interactions
The extension connects to:
- **Sui Blockchain RPC nodes**: For marketplace transactions only
- **Walrus Storage Network**: For encrypted data upload only (when you export)
- No personal data is sent to these services without encryption

## Your Control and Rights

### Granular Control
You can enable/disable collection for each category:
- URLs (hashed)
- Page titles
- Time on pages
- Interactions (clicks/scroll)
- Referrers
- Sessions
- Categories
- Keywords

### Global On/Off
Toggle data collection completely on or off at any time.

### Delete Your Data
- Clear all collected data with one click
- Delete data for specific domains
- All deletions are immediate and permanent

### View Your Data
- See all domains you've visited and event counts
- View storage usage statistics
- Review aggregated data before exporting

## Data Retention

- **Local Storage**: Data persists until you clear it or uninstall the extension
- **On Uninstall**: All local data is automatically deleted
- **Exported Data**: Once uploaded to Walrus, data persists on the decentralized network according to Walrus retention policies
- **Blockchain Records**: Marketplace listings on Sui blockchain are permanent but only contain metadata (not your actual browsing data)

## Permissions Explained

### Why We Need Each Permission:

**storage**: Store collected events and user preferences locally on your device

**activeTab**: Access current tab information when you click the extension icon

**scripting**: Inject content script to collect privacy-safe browsing signals

**tabs**: Access tab URLs and titles for event collection (URLs are immediately hashed)

**webNavigation**: Monitor page visits to track your browsing patterns

**host_permissions (<all_urls>)**: Allow content script to run on all sites you choose to monitor

## Children's Privacy

MineShare is not intended for users under 13 years of age. We do not knowingly collect data from children.

## Changes to Privacy Policy

We may update this privacy policy to reflect changes in our practices or legal requirements. Material changes will be notified through:
- Extension update notes
- Notification in the extension popup
- Updated "Last Updated" date at the top of this policy

## Open Source Transparency

MineShare is open source. You can review our code at:
- GitHub: https://github.com/sspirial/MineShare
- Verify that we collect only what we claim
- Audit our privacy protections yourself
- Submit issues or concerns

## Contact Us

If you have questions or concerns about privacy:
- GitHub Issues: https://github.com/sspirial/MineShare/issues
- Email: [Your contact email]

## Legal Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- GDPR (General Data Protection Regulation) principles
- CCPA (California Consumer Privacy Act) principles
- Local data protection laws where applicable

## Your California Privacy Rights (CCPA)

If you are a California resident, you have the right to:
- Know what data is collected (detailed above)
- Delete your data (available in extension settings)
- Opt-out of data "sales" (you control all exports)
- Non-discrimination for exercising your rights

## Your European Privacy Rights (GDPR)

If you are an EU resident, you have the right to:
- Access your data (view in extension)
- Rectification (delete and re-collect)
- Erasure (clear data button)
- Data portability (export feature)
- Withdraw consent (disable collection)
- Lodge a complaint with supervisory authority

## Consent

By installing and using MineShare:
- You consent to data collection as described in this policy
- You understand data collection is optional and under your control
- You can withdraw consent by disabling collection or uninstalling

---

**MineShare - Your Data, Your Control, Your Profit**
