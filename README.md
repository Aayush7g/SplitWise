# Split Expense App Backend

A Node.js/Express.js backend for a split expense application, similar to Splitwise.

## Features

- Expense Management (Add, List, Update, Delete)
- Multiple Split Types (Equal, Exact, Percentage)
- Settlement Calculation (Minimized transactions)
- Balance Tracking
- Optional Features:
  - Recurring Expenses
  - Categories
  - Spending Summary

## Tech Stack

- Node.js with Express.js
- MongoDB Atlas (NoSQL database)
- Express Validator for input validation
- CORS enabled
- Environment variables with dotenv

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Git

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd splitwise
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   PORT=3000
   MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/splitwise?retryWrites=true&w=majority
   NODE_ENV=development
   ```

4. Update MongoDB URI:
   - Create a cluster in MongoDB Atlas
   - Get your connection string
   - Replace it in the .env file

5. Seed the database with test data:
   ```bash
   npm run seed
   ```

6. Start the server:
   - Development mode: `npm run dev`
   - Production mode: `npm start`

## API Endpoints

### Expense Management

- **POST /api/expenses**
  - Add new expense
  - Body:
    ```json
    {
      "amount": 600,
      "description": "Dinner",
      "paid_by": "Shantanu",
      "split_between": ["Shantanu", "Sanket", "Om"],
      "split_type": "equal",
      "split_values": [] // Optional for equal split
    }
    ```

- **GET /api/expenses**
  - List all expenses

- **PUT /api/expenses/:id**
  - Update expense
  - Body: Same as POST

- **DELETE /api/expenses/:id**
  - Delete expense

### Settlements & Balances

- **GET /api/people**
  - Get all unique people

- **GET /api/balances**
  - Get net balance per person

- **GET /api/settlements**
  - Get optimized settlement transactions

## Error Handling

The API returns structured error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Server Error

## Settlement Logic

The app uses an optimized algorithm to minimize the number of transactions needed for settlement:

1. Calculate net balance for each person
2. Sort people by amount (positive to negative)
3. Match highest positive with highest negative
4. Repeat until all balances are settled

## Deployment

This backend is configured for deployment on Render:

1. Create a new Web Service on Render
2. Connect your repository
3. Set environment variables
4. Deploy!

## Testing  

Use the provided Postman collection for testing all endpoints:
[Link to Postman Collection]

## License

ISC
