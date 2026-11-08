# Holiday Open House 2026

**Live:**
- Invite: https://2026-holiday.washburnsurti.com
- Host page: https://2026-holiday.washburnsurti.com/host
- Vercel project: `2026-holiday-open-house` (jsurtis-projects), London region, Upstash Redis attached
- DNS: Squarespace CNAME `2026-holiday` → `24b3a908555af318.vercel-dns-017.com`

Every push to `main` on GitHub redeploys automatically.

---

# Holiday Open House — invitation, RSVPs & comment wall

Guests open a red envelope with a gold wax seal, the card slides out, and below it they can RSVP, see who's coming and leave a message. You manage everything from a private host page.

- **Invite:** `https://YOUR-SITE/`
- **Host page:** `https://YOUR-SITE/host` (password protected)

Setup takes about 10 minutes and costs nothing on the free tiers.

---

## 1. Put the code on GitHub (no terminal needed)

1. Sign in at github.com (create a free account if needed).
2. Click **+ → New repository**. Name it `holiday-open-house`, choose **Private**, click **Create repository**.
3. On the new repo page click **uploading an existing file**.
4. Unzip `holiday-open-house.zip`, open the `holiday-invite` folder, select **everything inside it** (the `api`, `lib`, `public`, `templates` folders and the files) and drag them into the browser. Click **Commit changes**.

## 2. Deploy on Vercel

1. Sign in at vercel.com with **Continue with GitHub**.
2. **Add New → Project**, pick `holiday-open-house`, click **Import**.
3. Leave all settings as they are. The project name becomes your web address (e.g. `elizabeth-jinal.vercel.app`), so change it here if you like.
4. Open **Environment Variables**, add:
   - Name `HOST_KEY`, Value: a password of your choice for the host page.
5. Click **Deploy**.

## 3. Add the database (stores RSVPs and comments)

1. In your Vercel project, open the **Storage** tab → **Create Database** → choose **Upstash for Redis** (from the Marketplace) → free plan, region **London** if offered.
2. When asked, **connect it to this project** (all environments). This adds the credentials automatically.
3. Go to **Deployments**, open the menu on the latest one and click **Redeploy** so it picks up the database.

## 4. Check it before sending

1. Open your site on your phone, open the envelope, send yourself a test RSVP and a test comment.
2. Open `/host`, enter your password and delete the test entries.
3. **Test the WhatsApp preview:** paste the link into a chat with yourself (or Elizabeth). You should see the invitation card image, "You're invited: Holiday Open House" and the date.

Use the address from the **Domains** section of the project (the clean `….vercel.app` one), not a long deployment-specific URL — those can require a Vercel login.

## 5. Send it

On `/host`, the **Share** box has a ready-made message. Tap **Copy message** and paste it into each WhatsApp group.

---

## Good to know

- **WhatsApp caches previews.** If you change the preview image after sharing, bump `?v=1` to `?v=2` in `templates/invite.html` (three places) and redeploy. To force a fresh preview for a link, you can share `https://YOUR-SITE/?x` instead.
- **Custom domain (optional):** Vercel → Settings → Domains. Nothing in the code needs changing; previews use whichever domain the page is opened on.
- **Guests changing their reply:** the page remembers them on that phone, so they tap **Change my reply**. If someone replies twice from different phones, delete the duplicate on `/host`.
- **Privacy:** guests see names and party sizes of those coming or maybe. Dietary needs and notes are only visible on `/host`. Guests can delete their own comments; you can delete any comment or reply.
- **Editing the wording:** all invitation text is in `templates/invite.html`. Edit the file on GitHub (pencil icon) and Vercel redeploys automatically within a minute.

## Running it locally (optional)

```
npm install
npm run dev
```

Open http://localhost:3000. Without database credentials it saves to `.dev-data.json`, and the host password is `dev`.
