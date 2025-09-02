# Review System Models

This directory contains the models for the review system, which allows event organizers to create review campaigns with custom questions and collect feedback from attendees.

## Models Overview

### ReviewCampaign

The main entity that represents a review campaign for an event.

**Fields:**

- `id`: Unique identifier (UUID)
- `name`: Campaign name
- `description`: Campaign description
- `eventId`: Reference to the event this campaign belongs to
- `questions`: Array of review questions
- `for`: Whether this campaign is for "all" attendees or specific "ticket_type"
- `for_id`: If for ticket_type, contains ticket type identifier(s)
- `dateCreated`: Creation timestamp
- `dateModified`: Last modification timestamp
- `reviews`: Array of reviews submitted for this campaign

### ReviewQuestion

Represents a question within a review campaign.

**Fields:**

- `id`: Unique identifier (UUID)
- `question`: The question text
- `questionType`: Type of question ("text", "range", "dropdown")
- `rangeMin`: Minimum value for range questions (nullable)
- `rangeMax`: Maximum value for range questions (nullable)
- `dropDown`: Array of dropdown options (for dropdown questions)
- `createdAt`: Creation timestamp
- `modifiedAt`: Last modification timestamp
- `reviewCampaign`: Reference to the parent campaign

### DropDown

Represents a dropdown option for dropdown-type questions.

**Fields:**

- `id`: Unique identifier (UUID)
- `text`: Display text for the option
- `value`: Value associated with the option
- `dateCreated`: Creation timestamp
- `dateModified`: Last modification timestamp
- `reviewQuestion`: Reference to the parent question

### Review

Represents a completed review submission.

**Fields:**

- `id`: Unique identifier (UUID)
- `reviewCampaign`: Reference to the campaign this review belongs to
- `answers`: Array of answers to the campaign questions
- `dateReviewCompleted`: When the review was completed
- `dateCreated`: Creation timestamp

### ReviewAnswer

Represents an answer to a specific question within a review.

**Fields:**

- `id`: Unique identifier (UUID)
- `review`: Reference to the parent review
- `questionId`: Reference to the question being answered
- `questionType`: Type of the question (for validation)
- `textAnswer`: Text answer (for text questions)
- `rangeAnswer`: Numeric answer (for range questions)
- `dropDownAnswer`: Selected dropdown option (for dropdown questions)
- `createAt`: Creation timestamp
- `modifiedAt`: Last modification timestamp

## Usage Examples

### Creating a Review Campaign

```typescript
const campaign = await ReviewCampaign.create({
  name: "Event Feedback 2024",
  description: "Please provide feedback about our event",
  eventId: event,
  for: "all",
  questions: [
    {
      question: "How would you rate the event?",
      questionType: "range",
      rangeMin: 1,
      rangeMax: 5,
    },
    {
      question: "What was your favorite part?",
      questionType: "text",
    },
    {
      question: "Would you attend again?",
      questionType: "dropdown",
      dropDown: [
        { text: "Yes", value: "yes" },
        { text: "No", value: "no" },
        { text: "Maybe", value: "maybe" },
      ],
    },
  ],
}).save();
```

### Submitting a Review

```typescript
const review = await Review.create({
  reviewCampaign: campaign,
  dateReviewCompleted: new Date(),
}).save();

const answers = [
  {
    review: review,
    questionId: question1,
    questionType: "range",
    rangeAnswer: 5,
  },
  {
    review: review,
    questionId: question2,
    questionType: "text",
    textAnswer: "The food was amazing!",
  },
  {
    review: review,
    questionId: question3,
    questionType: "dropdown",
    dropDownAnswer: dropdownOption,
  },
];

await ReviewAnswer.save(answers);
```

## GraphQL Queries and Mutations

The system provides comprehensive GraphQL operations:

### Queries

- `getReviewCampaigns(eventId)`: Get all campaigns for an event
- `getReviewCampaign(id)`: Get a specific campaign with questions and reviews
- `getReviewCampaignsForUser(eventId, ticketType)`: Get campaigns available to a user
- `getReviewsForCampaign(campaignId)`: Get all reviews for a campaign
- `getReview(id)`: Get a specific review with answers

### Mutations

- `createReviewCampaign(input)`: Create a new review campaign
- `updateReviewCampaign(input)`: Update an existing campaign
- `deleteReviewCampaign(id)`: Delete a campaign
- `addQuestionToCampaign(input)`: Add a question to an existing campaign
- `updateQuestion(input)`: Update a question
- `deleteQuestion(id)`: Delete a question
- `submitReview(input)`: Submit a new review
- `updateReview(input)`: Update an existing review

## Database Migration

Run the migration to create the necessary database tables:

```bash
npm run typeorm migration:run
```

The migration file `1700000000000-CreateReviewTables.ts` will create all the required tables with proper foreign key relationships.
