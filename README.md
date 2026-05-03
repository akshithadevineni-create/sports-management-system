# Sports+

## Shop checkout and Razorpay setup

The student shop now includes:

- an in-app cart with quantity controls and persisted state
- a dedicated `/checkout` page with delivery details and order summary
- Razorpay Standard Checkout integration for payments

To test payments locally, copy [.env.example](/Users/ananyagyana/Downloads/sepm/.env.example) to `.env` and add your Razorpay test credentials:

```bash
cp .env.example .env
```

Required environment variables:

- `VITE_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `VITE_RAZORPAY_BUSINESS_NAME` (optional override for the checkout header)

Implementation note:

- The frontend opens Razorpay Checkout from the student checkout page.
- A Vite dev-server endpoint at `/api/payments/razorpay/order` creates the required Razorpay order on the server side using your secret key.
- A second server endpoint at `/api/payments/razorpay/verify` verifies `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` before the cart is cleared.
- This matches Razorpay's documented flow, where a server-created `order_id` is required before opening checkout and the success callback must be verified server-side.

## Hybrid recommender backend

This repository now also includes a Python-based hybrid sports product recommendation system in [sports_recommender](/Users/ananyagyana/Downloads/sepm/sports_recommender).

### What it does

- Uses the attached Amazon-style review dataset at `/Users/ananyagyana/Desktop/Sports_and_Outdoors_5.json`
- Builds a content-based model with TF-IDF over `category + brand + sport_type`
- Builds a collaborative model with Surprise SVD on the user-item rating matrix
- Merges both signals with `final_score = alpha * content_score + (1 - alpha) * collab_score`
- Falls back to content-only recommendations for users with fewer than 3 ratings
- Exposes FastAPI endpoints for user recommendations and similar products

### Dataset note

The attached file contains review interactions but not standalone product metadata. The preprocessing pipeline therefore:

- uses real user/product/rating data from the attached JSON
- derives `name`, `category`, `brand`, `sport_type`, and `price` deterministically from the review corpus when no metadata file is supplied
- switches automatically to provided metadata if you later add a metadata CSV/JSON and pass its path

### Frontend shop dataset

The shop consumes generated ecommerce products from [src/data/ecommerceProducts.ts](/Users/ananyagyana/Downloads/sepm/src/data/ecommerceProducts.ts). This file is generated from the same Amazon Sports and Outdoors review dataset used by the recommender, while [src/data/sportsData.ts](/Users/ananyagyana/Downloads/sepm/src/data/sportsData.ts) keeps the old demo products as a fallback.

To regenerate the frontend shop dataset:

```bash
python3 tools/export_ecommerce_products.py \
  --reviews-path /Users/ananyagyana/Desktop/Sports_and_Outdoors_5.json \
  --output src/data/ecommerceProducts.ts \
  --limit 80
```

### Setup

Use Python `3.11` or `3.12` for the backend environment. In this sandbox, `scikit-surprise` failed to build under Python `3.13`, which is a package compatibility issue rather than a code issue.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Train and evaluate

```bash
python3 -m sports_recommender.train \
  --reviews-path /Users/ananyagyana/Desktop/Sports_and_Outdoors_5.json \
  --artifact-path artifacts/hybrid_recommender.pkl
```

This prints a comparison table for:

- `content_only`
- `collab_only`
- `hybrid`

using:

- RMSE
- MAE
- Precision@10
- Recall@10
- NDCG@10

### Run the API

```bash
uvicorn sports_recommender.api:app --reload
```

### Sample API calls

```bash
curl "http://127.0.0.1:8000/recommend?user_id=AIXZKN4ACSKI&top_n=10"
curl "http://127.0.0.1:8000/similar?product_id=1881509818&top_n=5"
python3 -m sports_recommender.sample_api_call
```

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## Deploy to Vercel

This project includes [vercel.json](/Users/ananyagyana/Downloads/sepm/vercel.json), which builds the Vite app from `npm run build`, serves `dist`, and keeps React Router routes working with an SPA fallback. Razorpay production endpoints are implemented as Vercel Functions in [api/payments/razorpay](/Users/ananyagyana/Downloads/sepm/api/payments/razorpay).

Before deploying, add these environment variables in Vercel Project Settings:

- `VITE_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `VITE_RAZORPAY_BUSINESS_NAME` (optional)

CLI deployment:

```bash
npx vercel login
npx vercel
npx vercel --prod
```

After deployment, test the shop checkout with Razorpay test credentials first, then switch the Vercel environment variables to live credentials when you are ready for real payments.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
