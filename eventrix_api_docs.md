# Eventrix Backend API Documentation

## Table of Contents
1. [GraphQL API](#graphql-api)
   - [Authentication & User Management](#authentication--user-management)
   - [User Profile & Following](#user-profile--following)
   - [Organizer Management](#organizer-management)
   - [Event Management](#event-management)
   - [Ticket Management](#ticket-management)
   - [Reviews & Ratings](#reviews--ratings)
   - [Analytics & Tracking](#analytics--tracking)
   - [Public Queries](#public-queries)
   - [Data Types](#data-types)
2. [REST API Endpoints](#rest-api-endpoints)
   - [Cart Management](#cart-management)
   - [User File Upload](#user-file-upload)
   - [Event File Management](#event-file-management)
   - [Organizer Management](#organizer-management-rest)
   - [Stripe Integration](#stripe-integration)
   - [WebSocket Events](#websocket-events)

---

# GraphQL API

---

## Authentication & User Management

### Query Operations

#### `serverIsLive`
**Description:** Health check endpoint to verify server status  
**Returns:** `Boolean!` - Server status  
**Authentication:** None required

#### `relogin(token: String)`
**Description:** Re-authenticate user with existing token  
**Parameters:**
- `token`: Authentication token (optional)  
**Returns:** `String!` - New authentication token

### Mutation Operations

#### `CreateUserAccount(password: String!, email: String!, username: String!)`
**Description:** Create a new user account  
**Parameters:**
- `password`: User's password
- `email`: User's email address
- `username`: Unique username  
**Returns:** `String!` - Success message or authentication token

#### `UserLogIn(password: String!, username: String!)`
**Description:** Authenticate user login  
**Parameters:**
- `password`: User's password
- `username`: Username or email  
**Returns:** `String!` - Authentication token

---

## User Profile & Following

### Query Operations

#### `getUserProfileInformation(token: String!)`
**Description:** Get detailed user profile information  
**Parameters:**
- `token`: Authentication token  
**Returns:** `UserProfileInformation!` - Complete user profile data

#### `usersFollowing(token: String!)`
**Description:** Get list of users that current user is following  
**Parameters:**
- `token`: Authentication token  
**Returns:** `[UsersFollowing!]!` - Array of followed users

#### `usersOrgFollowing(token: String!)`
**Description:** Get list of organizers that current user is following  
**Parameters:**
- `token`: Authentication token  
**Returns:** `[UsersFollowing!]!` - Array of followed organizers

### Mutation Operations

#### `modifyUserProfileInformation(arg: UserProfileInformationInput!, token: String!)`
**Description:** Update user profile information  
**Parameters:**
- `arg`: Profile update data
- `token`: Authentication token  
**Returns:** `String!` - Success message

#### `modifyUserNotifications(arg: UserNotificationsInput!, token: String!)`
**Description:** Update notification preferences  
**Parameters:**
- `arg`: Notification settings
- `token`: Authentication token  
**Returns:** `String!` - Success message

#### `followUser(userId: String!, token: String!)`
**Description:** Follow another user  
**Parameters:**
- `userId`: ID of user to follow
- `token`: Authentication token  
**Returns:** `String!` - Success message

#### `unFollowUser(userId: String!, token: String!)`
**Description:** Unfollow a user  
**Parameters:**
- `userId`: ID of user to unfollow
- `token`: Authentication token  
**Returns:** `String!` - Success message

#### `followOrganizer(organizerId: String!, token: String!)`
**Description:** Follow an organizer  
**Parameters:**
- `organizerId`: ID of organizer to follow
- `token`: Authentication token  
**Returns:** `String!` - Success message

#### `unFollowOrganizer(organizerId: String!, token: String!)`
**Description:** Unfollow an organizer  
**Parameters:**
- `organizerId`: ID of organizer to unfollow
- `token`: Authentication token  
**Returns:** `String!` - Success message

---

## Organizer Management

### Query Operations

#### `getOrganizerProfile(token: String!)`
**Description:** Get organizer profile information  
**Parameters:**
- `token`: Authentication token  
**Returns:** `Organizers!` - Organizer profile data

#### `getOrganizerSettingsPage(token: String!)`
**Description:** Get organizer settings page data  
**Parameters:**
- `token`: Authentication token  
**Returns:** `OrganizerSettingsPageResponse!` - Settings page information

#### `loadDashboardPage(token: String!)`
**Description:** Load organizer dashboard with key metrics  
**Parameters:**
- `token`: Authentication token  
**Returns:** `LoadDashboardPageResponse!` - Dashboard data including balance, events, tasks

### Mutation Operations

#### `CreateOrganizerAccount(password: String!, email: String!, orgName: String!)`
**Description:** Create a new organizer account  
**Parameters:**
- `password`: Account password
- `email`: Organization email
- `orgName`: Organization name  
**Returns:** `String!` - Success message or token

#### `OrganizerLogIn(password: String!, email: String!, orgName: String!)`
**Description:** Organizer login  
**Parameters:**
- `password`: Account password
- `email`: Organization email
- `orgName`: Organization name  
**Returns:** `String!` - Authentication token

#### `saveOrganizerSettings(args: OrganizerSettingsUpdateInput!, token: String!)`
**Description:** Update organizer settings  
**Parameters:**
- `args`: Settings update data
- `token`: Authentication token  
**Returns:** `OrganizerSettingsUpdateResponse!` - Update response

#### `addTeamMember(args: CreateOrganizerMemberInput!, token: String!)`
**Description:** Add new team member to organization  
**Parameters:**
- `args`: Team member data
- `token`: Authentication token  
**Returns:** `String!` - Success message

---

## Event Management

### Query Operations

#### `loadAllEventsPage(args: LoadAllEventPageInput!, token: String!)`
**Description:** Get paginated list of all events  
**Parameters:**
- `args`: Pagination and filter options
- `token`: Authentication token  
**Returns:** `LoadAllEventsPageResponse!` - Events list with pagination

#### `loadEventDetails(eventId: String!, token: String!)`
**Description:** Get detailed event information  
**Parameters:**
- `eventId`: Event ID
- `token`: Authentication token  
**Returns:** `LoadEventDetailsPageResponse!` - Event details

#### `getEventsPage(userToken: String, eventId: String!)`
**Description:** Get public event page information  
**Parameters:**
- `userToken`: User token (optional)
- `eventId`: Event ID  
**Returns:** `EventsPage!` - Public event page data

#### `getPopularEvents(token: String, longitude: Float, latitude: Float, limit: Float!)`
**Description:** Get popular events by location  
**Parameters:**
- `token`: User token (optional)
- `longitude`: Location longitude (default: 83.0458)
- `latitude`: Location latitude (default: 42.3314)
- `limit`: Number of events to return  
**Returns:** `[EventRecommendationResponse!]!` - Popular events

#### `getFeaturedEvents(token: String, longitude: Float, latitude: Float, limit: Float!)`
**Description:** Get featured events by location  
**Parameters:**
- `token`: User token (optional)
- `longitude`: Location longitude
- `latitude`: Location latitude
- `limit`: Number of events to return  
**Returns:** `[EventRecommendationResponse!]!` - Featured events

#### `getUpComingEvents(token: String, longitude: Float, latitude: Float, limit: Float!)`
**Description:** Get upcoming events by location  
**Parameters:**
- `token`: User token (optional)
- `longitude`: Location longitude
- `latitude`: Location latitude
- `limit`: Number of events to return  
**Returns:** `[EventRecommendationResponse!]!` - Upcoming events

### Mutation Operations

#### `createEvent(description: String!, title: String!, token: String!)`
**Description:** Create a new event  
**Parameters:**
- `description`: Event description
- `title`: Event title
- `token`: Authentication token  
**Returns:** `Events!` - Created event data

#### `repeatEvent(ticket: Boolean!, eventId: String!, token: String!)`
**Description:** Create a repeat/recurring event  
**Parameters:**
- `ticket`: Include ticket information
- `eventId`: Original event ID
- `token`: Authentication token  
**Returns:** `Events!` - New event data

#### `modifyEvent(args: ModifyEventInputType!, token: String!)`
**Description:** Update event information  
**Parameters:**
- `args`: Event update data
- `token`: Authentication token  
**Returns:** `String!` - Success message

---

## Ticket Management

### Query Operations

#### `getSalesPage(args: GetSalesPageInput!, eventId: String!, token: String!)`
**Description:** Get event sales information  
**Parameters:**
- `args`: Filter and search options
- `eventId`: Event ID
- `token`: Authentication token  
**Returns:** `GetSalesPageResponse!` - Sales data and tickets

#### `getTicketBuy(cart_id: String!)`
**Description:** Get ticket purchase information  
**Parameters:**
- `cart_id`: Cart/purchase ID  
**Returns:** `EventTicket!` - Ticket information

### Mutation Operations

#### `createEventTicket(description: String, currency: String, amount: Float!, title: String!, eventId: String!, token: String!)`
**Description:** Create a new ticket type for an event  
**Parameters:**
- `description`: Ticket description (optional)
- `currency`: Currency code (default: "usd")
- `amount`: Ticket price
- `title`: Ticket title
- `eventId`: Event ID
- `token`: Authentication token  
**Returns:** `String!` - Success message

#### `modifyEventTicket(args: ModifyEventTicketInputType!, eventId: String!, token: String!)`
**Description:** Update ticket information  
**Parameters:**
- `args`: Ticket update data
- `eventId`: Event ID
- `token`: Authentication token  
**Returns:** `String!` - Success message

#### `createTicketSellClientSecret(userToken: String, prices: [TicketBuyClientSecretUpdate!]!, eventId: String!)`
**Description:** Create payment client secret for ticket purchase  
**Parameters:**
- `userToken`: User token (optional)
- `prices`: Ticket prices and quantities
- `eventId`: Event ID  
**Returns:** `CreateTicketSellClientSecretResponse!` - Payment client secret and cart ID

#### `registerFreeEventTickets(args: RegisterFreeEventInput!)`
**Description:** Register for free event tickets  
**Parameters:**
- `args`: Registration information  
**Returns:** `String!` - Success message

---

## Reviews & Ratings

### Query Operations

#### `getReviewPage(eventId: String!, token: String!)`
**Description:** Get reviews for an event  
**Parameters:**
- `eventId`: Event ID
- `token`: Authentication token  
**Returns:** `[SalesReview!]!` - Event reviews

#### `getEventTicketsReviews(event_id: String!)`
**Description:** Get ticket reviews for an event  
**Parameters:**
- `event_id`: Event ID  
**Returns:** `[EventReviewCard!]!` - Ticket reviews

#### `getTicketReview(cart_id: String!)`
**Description:** Get review for a specific ticket purchase  
**Parameters:**
- `cart_id`: Cart/purchase ID  
**Returns:** `EventTicketReview!` - Ticket review information

### Mutation Operations

#### `submitTicketReview(args: EventTicketReviewInput!, cart_id: String!)`
**Description:** Submit a review for purchased tickets  
**Parameters:**
- `args`: Review data (rating, description, etc.)
- `cart_id`: Cart/purchase ID  
**Returns:** `String!` - Success message

#### `confirmTicketCheckIn(cart_id: String!)`
**Description:** Confirm ticket check-in at event  
**Parameters:**
- `cart_id`: Cart/purchase ID  
**Returns:** `String!` - Success message

---

## Analytics & Tracking

### Query Operations

#### `loadAllEventsGalleryPage(lastIndex: Float!, pageLength: Float!, eventId: String!, token: String!)`
**Description:** Load event photo gallery with pagination  
**Parameters:**
- `lastIndex`: Starting index for pagination
- `pageLength`: Number of items per page
- `eventId`: Event ID
- `token`: Authentication token  
**Returns:** `LoadAllEventsGalleryPageResponse!` - Gallery photos

### Mutation Operations

#### `addPhotoGallery(eventId: String!, photoUrl: String!, token: String!)`
**Description:** Add photo to event gallery  
**Parameters:**
- `eventId`: Event ID
- `photoUrl`: Photo URL
- `token`: Authentication token  
**Returns:** `PhotoGallery!` - Added photo information

#### `deletePhotoGallery(photoId: String!, token: String!)`
**Description:** Delete photo from gallery  
**Parameters:**
- `photoId`: Photo ID
- `token`: Authentication token  
**Returns:** `String!` - Success message

#### `createSiteHistory(arg: SiteHistoryInput!)`
**Description:** Track user site navigation and device information  
**Parameters:**
- `arg`: Site history data including device/browser info  
**Returns:** `String!` - Success message

---

## Public Queries

### Contact & Reservations

#### `makeReservation(reservationInput: ReservationInput!)`
**Description:** Make a reservation for an event  
**Parameters:**
- `reservationInput`: Reservation details  
**Returns:** `String!` - Success message

#### `makeContact(contactInput: ContactInput!)`
**Description:** Send contact form message  
**Parameters:**
- `contactInput`: Contact form data  
**Returns:** `String!` - Success message

#### `joinWaitlist(waitlistInput: WaitListInput!)`
**Description:** Join event waitlist  
**Parameters:**
- `waitlistInput`: Waitlist information  
**Returns:** `String!` - Success message

---

## Data Types

### Key Input Types

#### `UserProfileInformationInput`
- `firstName`: String (optional)
- `lastName`: String (optional)
- `email`: String (optional)
- `phoneNumber`: String (optional)
- `username`: String (optional)
- `searchMilesRadius`: Float (optional)

#### `ModifyEventInputType`
- `id`: String! (required)
- `title`: String (optional)
- `description`: String (optional)
- `visible`: Boolean (optional)
- `location`: String (optional)
- `banner`: String (optional)
- `startDate`: DateTimeISO (optional)
- `endDate`: DateTimeISO (optional)
- `timezone`: String (optional)

#### `ReservationInput`
- `first_name`: String!
- `last_name`: String!
- `date`: String!
- `time`: String!
- `event_name`: String!
- `email`: String!
- `phone_number`: String!

#### `ContactInput`
- `first_name`: String!
- `last_name`: String!
- `message`: String!
- `email`: String!
- `phone_number`: String!
- `organizer`: Boolean

### Key Response Types

#### `EventRecommendationResponse`
- `id`: ID!
- `title`: String!
- `description`: String!
- `banner`: String!
- `costRange`: String!
- `eventDate`: DateTimeISO!
- `location`: Location!
- `organizer`: EventOrganizerResponse!

#### `UserProfileInformation`
- `id`: ID!
- `firstName`: String!
- `lastName`: String!
- `email`: String!
- `phoneNumber`: String!
- `username`: String!
- `profilePicture`: String!
- `followers`: Float!
- `following`: Float!
- `events`: Float!
- `searchMilesRadius`: Float!
- `notificationsSettings`: UserNotificationsSettings!

---

## Authentication Notes

- Most mutations require a valid authentication token
- Tokens are obtained through login operations
- Some queries like event browsing can work with optional tokens
- Public endpoints (reservations, contact forms) don't require authentication

## Location Services

- Default location is Ann Arbor, Michigan (latitude: 42.3314, longitude: 83.0458)
- Location-based queries support custom coordinates
- Distance-based event recommendations available

## Pagination

- Most list queries support pagination through input parameters
- Common pattern: `lastIndex`, `pageLength`, `loadMore` boolean
- Filter and search options available for refined results
