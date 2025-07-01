# Auth0 Setup Guide for EventCraft

This guide will walk you through setting up Auth0 authentication for the EventCraft application.

## 1. Create an Auth0 Account

1. Go to [Auth0's website](https://auth0.com/) and sign up for a free account if you don't have one already.
2. Once logged in, you'll be in the Auth0 Dashboard.

## 2. Create a New Application

1. In the Auth0 Dashboard, click on "Applications" in the left sidebar.
2. Click the "Create Application" button.
3. Enter a name for your application (e.g., "EventCraft").
4. Select "Single Page Web Applications" as the application type.
5. Click "Create".

## 3. Configure Application Settings

After creating the application, you'll be taken to its settings page. Configure the following:

1. **Allowed Callback URLs**: 
   - Development: `http://localhost:5173`
   - Production: Your production URL

2. **Allowed Logout URLs**:
   - Development: `http://localhost:5173`
   - Production: Your production URL

3. **Allowed Web Origins**:
   - Development: `http://localhost:5173`
   - Production: Your production URL

4. **Allowed Origins (CORS)**:
   - Development: `http://localhost:5173`
   - Production: Your production URL

5. Scroll down and click "Save Changes".

## 4. Create an API

1. In the Auth0 Dashboard, click on "APIs" in the left sidebar.
2. Click the "Create API" button.
3. Enter a name for your API (e.g., "EventCraft API").
4. Set the Identifier to a URL-like value (e.g., `https://api.eventcraft.com`). This doesn't need to be a real URL, but it should be unique.
5. Keep the signing algorithm as RS256.
6. Click "Create".

## 5. Configure Environment Variables

### Frontend (.env file in frontend directory)

Create a `.env` file in the `frontend` directory with the following variables:

```
VITE_API_URL=http://localhost:5000
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_CALLBACK_URL=http://localhost:5173
```

Replace `your-auth0-domain.auth0.com` with your Auth0 domain and `your-auth0-client-id` with your Auth0 application's Client ID (found in the application settings).

### Backend (.env file in backend directory)

Create a `.env` file in the `backend` directory with the following variables:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/eventcraft
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=https://api.eventcraft.com
```

Replace `your-auth0-domain.auth0.com` with your Auth0 domain and `https://api.eventcraft.com` with the identifier you set for your API.

## 6. Configure MongoDB

1. Make sure you have MongoDB installed locally or set up a MongoDB Atlas cluster.
2. Update the `MONGO_URI` in the backend `.env` file to point to your MongoDB instance.

## 7. Start the Application

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Troubleshooting

### "Service not found" Error

If you encounter a "Service not found" error when logging in, try removing the `audience` parameter from the Auth0Provider component in `frontend/src/components/Auth0Provider.jsx`.

### CORS Issues

If you encounter CORS issues:

1. Make sure your Auth0 application's "Allowed Origins (CORS)" includes your frontend URL.
2. Check that your backend CORS settings in `server.js` allow requests from your frontend URL.

### JWT Validation Errors

If you see JWT validation errors in the backend:

1. Double-check that the `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` in your backend `.env` file match the values in your Auth0 dashboard.
2. Make sure the JWT middleware is correctly configured in `backend/middleware/auth.js`.

## Additional Resources

- [Auth0 React SDK Documentation](https://auth0.com/docs/quickstart/spa/react)
- [Auth0 Express API Documentation](https://auth0.com/docs/quickstart/backend/nodejs)
- [Auth0 JWT Debugging](https://auth0.com/docs/secure/tokens/json-web-tokens/validate-json-web-tokens) 

//commented