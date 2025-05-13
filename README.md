# 🧠 Mini CRM – Xeno SDE Internship Assignment (2025)

A full-stack CRM platform built for Xeno's SDE Internship Assignment. This solution empowers marketing teams to:

- Ingest and manage customer + order data
- Build targeted AI-assisted campaigns
- Simulate message delivery and track logs
- Gain insights into performance and engagement

Built with **Node.js**, **React (Vite)**, **MongoDB**, **Tailwind CSS**, and **Google Gemini AI**.

---

## 🚀 Core Features

### 👥 Customer Management
- Add new customers with name, email, phone
- View all customers in a responsive table

### 🛒 Order Management
- Add new orders linked to customers
- Automatically update:
  - Total spend
  - Total orders
  - Last order date

### 📣 Campaign Builder
- Input campaign name, message, and segmentation rules
- Use AI to:
  - Convert prompts like “users who spent over 10K and ordered < 3 times” into MongoDB filters
  - Suggest engaging marketing messages

### 🔍 Audience Preview
- View which customers match the segmentation rule (in real-time)
- Displays name, spend, and order count before creating campaign

### ✉️ Message Delivery Simulation
- Simulate message sends to matched audience
- 90% marked as “SENT”, 10% as “FAILED”
- Each attempt logged in `CommunicationLog`

### 🧠 AI-Powered Tools (Google Gemini)
- **Prompt → Segment Rule** (via `/api/ai/segment`)
- **Campaign Goal → Message** (via `/api/ai/messages`)
- Gemini model used: `gemini-2.0-flash`

### 📊 Campaign History
- View list of all past campaigns
- Shows name, audience size, and creation date
- Quick access to delivery logs per campaign

### 📬 Campaign Log Viewer
- Per-campaign delivery history
- Displays:
  - Customer name
  - Sent message
  - Status (✅ SENT / ❌ FAILED)
  - Vendor response
  - Timestamp

### 🔐 Authentication
- Google OAuth 2.0 login
- JWT issued upon login
- Frontend stores token and uses protected routes

### 🖥️ Frontend UI
- Built with React + Vite
- Responsive and styled with Tailwind CSS
- Global top navbar with route links
- Protected routes using custom `PrivateRoute` component

---

## 🧪 Technologies Used

| Layer         | Stack                                     |
|--------------|--------------------------------------------|
| Frontend     | React (Vite), Tailwind CSS, React Router   |
| Backend      | Node.js, Express, Mongoose (MongoDB)       |
| AI Services  | Google Gemini AI API                       |
| Auth         | Google OAuth 2.0, JWT, Passport.js         |
| Tools        | Axios, dotenv, cookie-parser               |

---

## 🔧 Local Setup

### 📦 Backend
```bash
cd backend
npm install
npm run dev
````

`.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

### 💻 Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on: [http://localhost:5173](http://localhost:5173)

---

## 🌐 Deployment

| Platform | URL                  |
| -------- | -------------------- |
| Frontend | Vercel               |
| Backend  | Render               |

---

## 📁 Folder Structure

```
/backend
  ├── models/
  ├── controllers/
  ├── routes/
  ├── services/         # AI services (Gemini)
  ├── middleware/
  └── server.js

/frontend
  ├── pages/
  ├── components/
  ├── routes/
  ├── api/
  └── App.jsx / main.jsx
```

---

## ✅ Assignment Feature Checklist

| Feature                              | Status |
| ------------------------------------ | ------ |
| Customer ingestion                   | ✅      |
| Order ingestion + stats update       | ✅      |
| Campaign creation with segment rules | ✅      |
| Delivery simulation + log creation   | ✅      |
| Google OAuth 2.0 auth + JWT          | ✅      |
| Campaign preview (audience matching) | ✅      |
| Campaign history viewer              | ✅      |
| Campaign delivery log viewer         | ✅      |
| AI prompt → Mongo filter (Gemini)    | ✅      |
| AI message suggestion (Gemini)       | ✅      |
| Global navbar + logout               | ✅      |
| Protected routes (frontend)          | ✅      |
| Fully responsive Tailwind UI         | ✅      |

---

---

## 🧠 Sample AI Output

**Prompt:**

```
Users who spent over 10000 and ordered less than 3 times
```

**Gemini Output:**

```json
{
  "spent": { "$gt": 10000 },
  "orders": { "$lt": 3 }
}
```

**AI-Generated Message:**

```
We miss you! Here's 10% off your next order. Shop now!
```

---

## 👨‍💻 Author

**Shinkhal Sinha**
🌐 [shinkhal-sinha.online](https://port-folio-react-ruby.vercel.app/)
📫 [shinkhalsinha@gmail.com](mailto:arjunarora3682@gmail.com)

---

## 📄 License

This project is part of Xeno's SDE Internship Assignment 2025.
