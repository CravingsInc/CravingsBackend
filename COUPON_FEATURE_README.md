# Coupon Code Feature Implementation

## Overview

This implementation adds a comprehensive coupon code system to the CravingsBackend ticketing platform, allowing event organizers to create and manage discount codes for their events.

## Features

### 1. Coupon Management

- **Create Coupons**: Organizers can create coupons with various discount types
- **Update Coupons**: Modify existing coupon details
- **Delete Coupons**: Remove coupons from the system
- **View Coupons**: List all coupons for an event
- **Auto-Generate Codes**: Automatically generate unique coupon codes

### 2. Discount Types

- **Percentage Discount**: Apply a percentage off the total ticket price
- **Fixed Amount Discount**: Apply a fixed dollar amount discount

### 3. Coupon Validation

- **Event-specific**: Coupons are tied to specific events
- **Ticket-specific**: Can apply to all tickets or specific ticket types
- **Usage Limits**: Set maximum number of times a coupon can be used
- **Time-based**: Set validity periods (start and end dates)
- **Active/Inactive**: Enable or disable coupons

### 4. Integration with Payment Flow

- **Cart Integration**: Coupons can be applied to shopping carts
- **Payment Processing**: Discounts are calculated and applied during Stripe payment processing
- **Usage Tracking**: Coupon usage is automatically incremented upon successful payment

### 5. Sales API Integration

- **Coupon Information**: Sales data includes applied coupon details
- **Discount Tracking**: Original amount, discount amount, and final amount are tracked
- **Coupon Analytics**: View all coupons for an event in the sales page

## Database Schema

### Coupon Model

```typescript
@Entity()
export class Coupon extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  description: string;

  @Column({ type: "float" })
  discountAmount: number;

  @Column({ default: "percentage" })
  discountType: "percentage" | "fixed";

  @Column({ default: 1 })
  maxUses: number;

  @Column({ default: 0 })
  currentUses: number;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  validFrom: Date;

  @Column({ nullable: true })
  validUntil: Date;

  @Column({ default: false })
  appliesToAllTickets: boolean;

  @ManyToOne(() => Events, { onDelete: "CASCADE" })
  event: Events;

  @ManyToOne(() => EventTickets, { nullable: true, onDelete: "CASCADE" })
  specificTicket: EventTickets;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Updated Cart Model

```typescript
// Added coupon-related fields to EventTicketCart
@ManyToOne(() => Coupon, { nullable: true, onDelete: "SET NULL" })
appliedCoupon?: Coupon | null;

@Column({ nullable: true })
appliedCouponId?: string;

@Column({ type: 'float', default: 0 })
discountAmount: number;

@Column({ type: 'float', default: 0 })
originalTotal: number;

@Column({ type: 'float', default: 0 })
finalTotal: number;
```

## API Endpoints

### REST API Endpoints

#### Generate Coupon Code

```http
GET /api/coupon/generate
Authorization: Bearer <organizer_token>

Response:
{
    "success": true,
    "couponCode": "ABC12345",
    "message": "Coupon code generated successfully"
}
```

#### Validate Coupon Code

```http
GET /api/coupon/validate/:code?eventId=xxx&ticketId=xxx

Response:
{
    "success": true,
    "valid": true,
    "discountAmount": 20,
    "discountType": "percentage",
    "couponId": "uuid",
    "message": "Coupon is valid"
}
```

### GraphQL API Endpoints

### Coupon Management (Organizer Only)

#### Generate Coupon Code

```graphql
mutation generateCouponCode($token: String!) {
  generateCouponCode(token: $token)
}
```

#### Create Coupon

```graphql
mutation createCoupon($token: String!, $input: CreateCouponInput!) {
  createCoupon(token: $token, input: $input) {
    id
    code
    description
    discountAmount
    discountType
    maxUses
    currentUses
    active
    appliesToAllTickets
    specificTicketId
    createdAt
  }
}
```

#### Update Coupon

```graphql
mutation updateCoupon($token: String!, $input: UpdateCouponInput!) {
  updateCoupon(token: $token, input: $input) {
    id
    code
    description
    discountAmount
    discountType
    maxUses
    currentUses
    active
    appliesToAllTickets
    specificTicketId
    updatedAt
  }
}
```

#### Delete Coupon

```graphql
mutation deleteCoupon($token: String!, $id: String!) {
  deleteCoupon(token: $token, id: $id)
}
```

#### Get Event Coupons

```graphql
query getEventCoupons($token: String!, $eventId: String!) {
  getEventCoupons(token: $token, eventId: $eventId) {
    coupons {
      id
      code
      description
      discountAmount
      discountType
      maxUses
      currentUses
      active
      appliesToAllTickets
      specificTicketTitle
      createdAt
    }
    total
  }
}
```

#### Get Single Coupon

```graphql
query getCoupon($token: String!, $id: String!) {
  getCoupon(token: $token, id: $id) {
    id
    code
    description
    discountAmount
    discountType
    maxUses
    currentUses
    active
    appliesToAllTickets
    specificTicketTitle
    createdAt
    updatedAt
  }
}
```

### Coupon Validation (Public)

#### Validate Coupon

```graphql
query validateCoupon($input: ValidateCouponInput!) {
  validateCoupon(input: $input) {
    valid
    message
    discountAmount
    discountType
    couponId
  }
}
```

### Cart Operations (Public)

#### Apply Coupon to Cart

```graphql
mutation applyCouponToCart($cartId: String!, $couponCode: String!) {
  applyCouponToCart(cartId: $cartId, couponCode: $couponCode) {
    valid
    message
    discountAmount
    discountType
    couponId
  }
}
```

#### Remove Coupon from Cart

```graphql
mutation removeCouponFromCart($cartId: String!) {
  removeCouponFromCart(cartId: $cartId)
}
```

### Updated Ticket Purchase (Public)

#### Create Payment Intent with Coupon

```graphql
mutation createTicketSellClientSecret($eventId: String!, $prices: [TicketBuyClientSecretUpdate!]!, $userToken: String, $couponCode: String) {
  createTicketSellClientSecret(eventId: $eventId, prices: $prices, userToken: $userToken, couponCode: $couponCode) {
    client_secret
    cartId
  }
}
```

#### Update Payment Intent with Coupon

```graphql
mutation updateTicketSellClientSecret($id: String!, $eventId: String!, $prices: [TicketBuyClientSecretUpdate!]!, $couponCode: String) {
  updateTicketSellClientSecret(id: $id, eventId: $eventId, prices: $prices, couponCode: $couponCode)
}
```

### Sales API (Organizer Only)

#### Get Sales Page with Coupon Information

```graphql
query getSalesPage($token: String!, $eventId: String!, $search: String, $ticketType: String) {
  getSalesPage(token: $token, eventId: $eventId, search: $search, ticketType: $ticketType) {
    tickets {
      id
      title
      description
      totalTickets
      ticketSold
      ticketPrice
    }
    sales {
      id
      name
      amount
      originalAmount
      discountAmount
      appliedCoupon {
        code
        description
        discountAmount
        discountType
      }
      dateCreated
      currency
      checkIn {
        checkIn
        date
      }
      completed {
        completed
        date
      }
      tickets {
        id
        title
        description
        quantity
        price
      }
      review {
        id
        name
        profile
        rating
        description
        completed
        date
      }
    }
  }
}
```

#### Get Event Coupons for Sales Page

```graphql
query getEventCouponsForSales($token: String!, $eventId: String!) {
  getEventCouponsForSales(token: $token, eventId: $eventId) {
    coupons {
      id
      code
      description
      discountAmount
      discountType
      maxUses
      currentUses
      active
      appliesToAllTickets
      specificTicketTitle
      createdAt
    }
    total
  }
}
```

## Input Types

### CreateCouponInput

```typescript
@InputType()
export class CreateCouponInput {
  @Field() eventId: string;
  @Field() code: string; // Can be empty for auto-generation
  @Field() description: string;
  @Field() discountAmount: number;
  @Field({ defaultValue: "percentage" }) discountType: "percentage" | "fixed";
  @Field({ defaultValue: 1 }) maxUses: number;
  @Field({ nullable: true }) validFrom?: Date;
  @Field({ nullable: true }) validUntil?: Date;
  @Field({ defaultValue: false }) appliesToAllTickets: boolean;
  @Field({ nullable: true }) specificTicketId?: string;
}
```

### ValidateCouponInput

```typescript
@InputType()
export class ValidateCouponInput {
  @Field() eventId: string;
  @Field() code: string;
  @Field({ nullable: true }) ticketId?: string;
}
```

## Frontend Integration

### Coupon Code Generation

#### Option 1: REST API (Recommended for Frontend)

```javascript
// Generate coupon code
const generateCouponCode = async (organizerToken) => {
  try {
    const response = await fetch("/api/coupon/generate", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${organizerToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.couponCode; // e.g., "ABC12345"
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error generating coupon code:", error);
    throw error;
  }
};

// Usage
const handleGenerateCode = async () => {
  try {
    const couponCode = await generateCouponCode(organizerToken);
    console.log("Generated code:", couponCode);
    // Update your form field with the generated code
    setCouponCode(couponCode);
  } catch (error) {
    // Handle error
  }
};
```

#### Option 2: GraphQL

```javascript
// Generate coupon code using GraphQL
const GENERATE_COUPON_CODE = gql`
  mutation generateCouponCode($token: String!) {
    generateCouponCode(token: $token)
  }
`;

const [generateCode] = useMutation(GENERATE_COUPON_CODE);

const handleGenerateCode = async () => {
  try {
    const { data } = await generateCode({
      variables: { token: organizerToken },
    });
    const couponCode = data.generateCouponCode;
    console.log("Generated code:", couponCode);
    setCouponCode(couponCode);
  } catch (error) {
    console.error("Error generating code:", error);
  }
};
```

### Coupon Creation with Auto-Generation

```javascript
// Create coupon with empty code (auto-generates)
const createCouponInput = {
  eventId: "event-uuid",
  code: "", // Empty code will be auto-generated
  description: "20% off all tickets",
  discountAmount: 20,
  discountType: "percentage",
  maxUses: 50,
  appliesToAllTickets: true,
};

// The system will automatically generate a unique code
const CREATE_COUPON = gql`
  mutation createCoupon($token: String!, $input: CreateCouponInput!) {
    createCoupon(token: $token, input: $input) {
      id
      code
      description
      discountAmount
      discountType
    }
  }
`;

// Usage
const [createCoupon] = useMutation(CREATE_COUPON);

const handleCreateCoupon = async () => {
  try {
    const { data } = await createCoupon({
      variables: {
        token: organizerToken,
        input: createCouponInput,
      },
    });

    console.log("Created coupon with code:", data.createCoupon.code);
    // The code was auto-generated
  } catch (error) {
    console.error("Error creating coupon:", error);
  }
};
```

### Sales Page Integration

```javascript
// Get sales data with coupon information
const GET_SALES_PAGE = gql`
  query getSalesPage($token: String!, $eventId: String!) {
    getSalesPage(token: $token, eventId: $eventId) {
      sales {
        id
        name
        amount
        originalAmount
        discountAmount
        appliedCoupon {
          code
          description
          discountAmount
          discountType
        }
        dateCreated
        tickets {
          title
          quantity
          price
        }
      }
    }
  }
`;

// Display coupon information in sales table
const SalesTable = ({ sales }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Customer</th>
          <th>Original Amount</th>
          <th>Discount</th>
          <th>Final Amount</th>
          <th>Coupon Used</th>
        </tr>
      </thead>
      <tbody>
        {sales.map((sale) => (
          <tr key={sale.id}>
            <td>{sale.name}</td>
            <td>${sale.originalAmount}</td>
            <td>${sale.discountAmount}</td>
            <td>${sale.amount}</td>
            <td>
              {sale.appliedCoupon ? (
                <span>
                  {sale.appliedCoupon.code}({sale.appliedCoupon.discountAmount}
                  {sale.appliedCoupon.discountType === "percentage" ? "%" : "$"})
                </span>
              ) : (
                "None"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

## Usage Examples

### Creating a Percentage Discount Coupon

```javascript
const createCouponInput = {
  eventId: "event-uuid",
  code: "SAVE20",
  description: "20% off all tickets",
  discountAmount: 20,
  discountType: "percentage",
  maxUses: 50,
  appliesToAllTickets: true,
};
```

### Creating a Fixed Amount Discount Coupon

```javascript
const createFixedCouponInput = {
  eventId: "event-uuid",
  code: "SAVE10",
  description: "$10 off VIP tickets",
  discountAmount: 10,
  discountType: "fixed",
  maxUses: 25,
  appliesToAllTickets: false,
  specificTicketId: "ticket-uuid",
};
```

### Auto-Generating Coupon Code

```javascript
const createAutoGeneratedCoupon = {
  eventId: "event-uuid",
  code: "", // Empty code will be auto-generated
  description: "Auto-generated discount",
  discountAmount: 15,
  discountType: "percentage",
  maxUses: 30,
  appliesToAllTickets: true,
};
```

### Validating a Coupon

```javascript
const validateInput = {
  eventId: "event-uuid",
  code: "SAVE20",
  ticketId: "ticket-uuid", // optional
};
```

## Testing

### Run Migration

```bash
npm run migration
```

### Test Coupon Functionality

```bash
npm run test-coupon
```

### Test Coupon Generation API

```bash
npm run test-coupon-api
```

### Sample Test Data

The migration creates sample coupons for testing:

- **SAVE20XXXX**: 20% off all tickets
- **FIXED10XXXX**: $10 off specific tickets
- **EXPIREDXXXX**: Expired coupon for testing

## Security Features

1. **Organizer Authorization**: Only event organizers can create/manage coupons for their events
2. **Unique Coupon Codes**: Each coupon code must be unique across the system
3. **Usage Limits**: Coupons are automatically disabled when usage limit is reached
4. **Time Validation**: Coupons are validated against start/end dates
5. **Event-specific**: Coupons can only be used for their designated events

## Error Handling

The system provides comprehensive error messages for:

- Invalid coupon codes
- Expired coupons
- Usage limit exceeded
- Wrong event/ticket type
- Inactive coupons
- Unauthorized access

## Integration Points

1. **Stripe Payment Processing**: Discounts are calculated and applied during payment intent creation
2. **Cart Management**: Coupons can be applied/removed from shopping carts
3. **Webhook Processing**: Coupon usage is automatically tracked upon successful payment
4. **Email Notifications**: Coupon information is included in ticket confirmation emails

## Future Enhancements

1. **Bulk Coupon Creation**: Create multiple coupons at once
2. **Coupon Analytics**: Track coupon performance and usage statistics
3. **Advanced Rules**: Minimum purchase amounts, user-specific coupons
4. **Coupon Templates**: Predefined coupon configurations
5. **A/B Testing**: Test different discount strategies

## Files Modified/Created

### New Files

- `src/models/organizers/events/Coupon.ts` - Coupon entity
- `src/models/types/organizer/Coupon.ts` - Coupon GraphQL types
- `src/resolvers/CouponResolver.ts` - Coupon management resolver
- `src/migration/events/createCoupons.ts` - Sample coupon migration
- `src/test-coupon.ts` - Coupon functionality test
- `COUPON_FEATURE_README.md` - This documentation

### Modified Files

- `src/models/organizers/events/EventTicketCart.ts` - Added coupon fields
- `src/models/organizers/events/index.ts` - Export Coupon model
- `src/models/types/organizer/index.ts` - Export coupon types
- `src/resolvers/EventResolver.ts` - Added coupon validation and cart operations
- `src/resolvers/index.ts` - Export CouponResolver
- `src/utils/stripe/ticketClientSecerets.ts` - Updated payment intent creation
- `src/utils/stripe/webhook/buyTicketSucceded.ts` - Added coupon usage tracking
- `src/migration/events/index.ts` - Include coupon creation in migration

This implementation provides a complete, production-ready coupon system that integrates seamlessly with the existing ticketing platform.

## 🎯 **Methods to Generate Coupon Codes**

### **1. REST API (Recommended for Frontend)**

#### **Generate a Single Coupon Code**

```javascript
// Frontend JavaScript/TypeScript
const generateCouponCode = async (organizerToken) => {
  try {
    const response = await fetch("/api/coupon/generate", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${organizerToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.couponCode; // e.g., "ABC12345"
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error generating coupon code:", error);
    throw error;
  }
};

// Usage
const handleGenerateCode = async () => {
  try {
    const couponCode = await generateCouponCode(organizerToken);
    console.log("Generated code:", couponCode);
    // Update your form field with the generated code
    setCouponCode(couponCode);
  } catch (error) {
    // Handle error
  }
};
```

#### **Frontend Button Implementation**

```jsx
// React component example
const CouponForm = () => {
  const [couponCode, setCouponCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const code = await generateCouponCode(organizerToken);
      setCouponCode(code);
    } catch (error) {
      alert("Failed to generate coupon code");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter coupon code or generate one" />
      <button onClick={handleGenerateCode} disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Generate Code"}
      </button>
    </div>
  );
};
```

### **2. GraphQL API**

#### **Generate Coupon Code via GraphQL**

```javascript
// GraphQL mutation
const GENERATE_COUPON_CODE = gql`
  mutation generateCouponCode($token: String!) {
    generateCouponCode(token: $token)
  }
`;

// Using Apollo Client
const [generateCode] = useMutation(GENERATE_COUPON_CODE);

const handleGenerateCode = async () => {
  try {
    const { data } = await generateCode({
      variables: { token: organizerToken },
    });
    const couponCode = data.generateCouponCode;
    console.log("Generated code:", couponCode);
    setCouponCode(couponCode);
  } catch (error) {
    console.error("Error generating code:", error);
  }
};
```

### **3. Auto-Generation During Coupon Creation**

#### **Create Coupon with Empty Code (Auto-Generates)**

```javascript
// GraphQL mutation
const CREATE_COUPON = gql`
  mutation createCoupon($token: String!, $input: CreateCouponInput!) {
    createCoupon(token: $token, input: $input) {
      id
      code
      description
      discountAmount
      discountType
    }
  }
`;

// Input with empty code (will be auto-generated)
const createCouponInput = {
  eventId: "your-event-id",
  code: "", // Empty code will be auto-generated
  description: "20% off all tickets",
  discountAmount: 20,
  discountType: "percentage",
  maxUses: 50,
  appliesToAllTickets: true,
};

// Usage
const [createCoupon] = useMutation(CREATE_COUPON);

const handleCreateCoupon = async () => {
  try {
    const { data } = await createCoupon({
      variables: {
        token: organizerToken,
        input: createCouponInput,
      },
    });

    console.log("Created coupon with code:", data.createCoupon.code);
    // The code was auto-generated
  } catch (error) {
    console.error("Error creating coupon:", error);
  }
};
```

### **4. Testing the API**

#### **Using cURL**

```bash
# Generate a coupon code
curl -X GET "http://localhost:3000/api/coupon/generate" \
  -H "Authorization: Bearer YOUR_ORGANIZER_TOKEN" \
  -H "Content-Type: application/json"

# Response:
# {
#   "success": true,
#   "couponCode": "ABC12345",
#   "message": "Coupon code generated successfully"
# }
```

#### **Using Postman**

1. **Method**: GET
2. **URL**: `http://localhost:3000/api/coupon/generate`
3. **Headers**:
   - `Authorization`: `Bearer YOUR_ORGANIZER_TOKEN`
   - `Content-Type`: `application/json`

### **5. Complete Frontend Workflow**

```javascript
<code_block_to_apply_changes_from>
```

## 🎯 **Recommended Approach**

For the best user experience, I recommend:

1. **Use the REST API** (`/api/coupon/generate`) for the "Generate Code" button
2. **Auto-fill the code field** when the button is clicked
3. **Allow manual editing** of the generated code if needed
4. **Use auto-generation** as a fallback when creating coupons with empty codes

This gives organizers the flexibility to either use the generated code as-is or modify it to something more memorable for their marketing campaigns.
