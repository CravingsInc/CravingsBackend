# Review System Documentation

This directory contains the models and resolvers for the review system, which allows event organizers to create review campaigns with custom questions and collect feedback from attendees.

## Table of Contents

1. [Models Overview](#models-overview)
2. [ReviewCampaign Model](#reviewcampaign-model)
3. [ReviewQuestion Model](#reviewquestion-model)
4. [Review Model](#review-model)
5. [ReviewAnswer Model](#reviewanswer-model)
6. [DropDown Model](#dropdown-model)
7. [GraphQL Mutations](#graphql-mutations)
8. [GraphQL Queries](#graphql-queries)
9. [Usage Examples](#usage-examples)
10. [Database Schema](#database-schema)

## Models Overview

### ReviewCampaign

The main entity that represents a review campaign for an event. A campaign contains multiple questions and collects reviews from attendees.

**Key Features:**

- Campaign targeting (all attendees or specific ticket types)
- Date range for campaign availability
- Multiple question types support
- Review collection and analysis

### ReviewQuestion

Represents a question within a review campaign. Questions can be of different types: text, range (numeric), or dropdown.

**Question Types:**

- **Text**: Free-form text responses
- **Range**: Numeric responses within a specified range
- **Dropdown**: Multiple choice from predefined options

### Review

Represents a completed review submission by an attendee.

### ReviewAnswer

Represents an answer to a specific question within a review.

### DropDown

Represents a dropdown option for dropdown-type questions.

## ReviewCampaign Model

### Fields

| Field          | Type     | Description                                           | Required |
| -------------- | -------- | ----------------------------------------------------- | -------- |
| `id`           | UUID     | Unique identifier                                     | Yes      |
| `title`        | String   | Campaign title                                        | Yes      |
| `description`  | Text     | Campaign description                                  | No       |
| `eventId`      | Events   | Reference to the event                                | Yes      |
| `startDate`    | DateTime | Campaign start date                                   | No       |
| `endDate`      | DateTime | Campaign end date                                     | No       |
| `for`          | Enum     | Target audience: "all" or "ticket_type"               | Yes      |
| `for_id`       | String   | Ticket type identifier(s) if targeting specific types | No       |
| `dateCreated`  | DateTime | Creation timestamp                                    | Auto     |
| `dateModified` | DateTime | Last modification timestamp                           | Auto     |

### Relationships

- **One-to-Many** with `ReviewQuestion`: A campaign can have multiple questions
- **One-to-Many** with `Review`: A campaign can have multiple reviews
- **Many-to-One** with `Events`: A campaign belongs to one event

### Example

```typescript
const campaign = new ReviewCampaign();
campaign.title = "Event Feedback 2024";
campaign.description = "Please provide feedback about our event";
campaign.eventId = event;
campaign.startDate = new Date("2024-01-01");
campaign.endDate = new Date("2024-01-31");
campaign.for = "all";
```

## ReviewQuestion Model

### Fields

| Field          | Type     | Description                          | Required |
| -------------- | -------- | ------------------------------------ | -------- |
| `id`           | UUID     | Unique identifier                    | Yes      |
| `question`     | String   | The question text                    | Yes      |
| `questionType` | Enum     | Type: "text", "range", or "dropdown" | Yes      |
| `rangeMin`     | Integer  | Minimum value for range questions    | No       |
| `rangeMax`     | Integer  | Maximum value for range questions    | No       |
| `createdAt`    | DateTime | Creation timestamp                   | Auto     |
| `modifiedAt`   | DateTime | Last modification timestamp          | Auto     |

### Relationships

- **Many-to-One** with `ReviewCampaign`: A question belongs to one campaign
- **One-to-Many** with `DropDown`: A question can have multiple dropdown options
- **One-to-Many** with `ReviewAnswer`: A question can have multiple answers

### Question Types

#### Text Questions

```typescript
{
  question: "What was your favorite part of the event?",
  questionType: "text"
}
```

#### Range Questions

```typescript
{
  question: "How would you rate the event?",
  questionType: "range",
  rangeMin: 1,
  rangeMax: 5
}
```

#### Dropdown Questions

```typescript
{
  question: "Would you attend again?",
  questionType: "dropdown",
  dropDown: [
    { text: "Yes", value: "yes" },
    { text: "No", value: "no" },
    { text: "Maybe", value: "maybe" }
  ]
}
```

## GraphQL Mutations

### createReviewCampaign

Creates a new review campaign with questions.

**Input Type:** `CreateReviewCampaignInput`

```typescript
{
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  eventId: string;
  questions: ReviewQuestionInput[];
  for: "all" | "ticket_type";
  for_id?: string;
}
```

**Example Mutation:**

```graphql
mutation CreateReviewCampaign($input: CreateReviewCampaignInput!) {
  createReviewCampaign(input: $input) {
    reviewCampaign {
      id
      title
      description
      for
      dateCreated
      questions {
        id
        question
        questionType
      }
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "title": "Event Feedback 2024",
    "description": "Please provide feedback about our event",
    "eventId": "event-uuid-here",
    "for": "all",
    "questions": [
      {
        "question": "How would you rate the event?",
        "questionType": "range",
        "rangeMin": 1,
        "rangeMax": 5
      },
      {
        "question": "What was your favorite part?",
        "questionType": "text"
      },
      {
        "question": "Would you attend again?",
        "questionType": "dropdown",
        "dropDown": [
          { "text": "Yes", "value": "yes" },
          { "text": "No", "value": "no" },
          { "text": "Maybe", "value": "maybe" }
        ]
      }
    ]
  }
}
```

**Response:**

```json
{
  "data": {
    "createReviewCampaign": {
      "reviewCampaign": {
        "id": "campaign-uuid",
        "title": "Event Feedback 2024",
        "description": "Please provide feedback about our event",
        "for": "all",
        "dateCreated": "2024-01-01T00:00:00Z",
        "questions": [
          {
            "id": "question-1-uuid",
            "question": "How would you rate the event?",
            "questionType": "range"
          }
        ]
      }
    }
  }
}
```

### modifyReviewCampaign

Modifies an existing review campaign's title, description, and target audience.

**Parameters:**

- `campaignId`: string - The ID of the campaign to modify
- `newTitle`: string - The new title for the campaign
- `newDescription`: string - The new description for the campaign
- `newFor`: "all" | "ticket_type" - The new target audience setting

**Example Mutation:**

```graphql
mutation ModifyReviewCampaign($campaignId: String!, $newTitle: String!, $newDescription: String!, $newFor: String!) {
  modifyReviewCampaign(campaignId: $campaignId, newTitle: $newTitle, newDescription: $newDescription, newFor: $newFor) {
    id
    title
    description
    for
    dateModified
  }
}
```

**Variables:**

```json
{
  "campaignId": "campaign-uuid-here",
  "newTitle": "Updated Event Feedback 2024",
  "newDescription": "Updated description for the feedback campaign",
  "newFor": "ticket_type"
}
```

**Response:**

```json
{
  "data": {
    "modifyReviewCampaign": {
      "id": "campaign-uuid",
      "title": "Updated Event Feedback 2024",
      "description": "Updated description for the feedback campaign",
      "for": "ticket_type",
      "dateModified": "2024-01-02T12:00:00Z"
    }
  }
}
```

### updateReviewCampaign

Updates an existing review campaign with partial data.

**Input Type:** `UpdateReviewCampaignInput`

```typescript
{
  id: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  for?: "all" | "ticket_type";
  for_id?: string;
}
```

### deleteReviewCampaign

Deletes a review campaign and all associated questions and reviews.

**Parameters:**

- `id`: string - The ID of the campaign to delete

### addQuestionToCampaign

Adds a new question to an existing campaign.

**Input Type:** `AddQuestionToCampaignInput`

### updateQuestion

Updates an existing question.

**Input Type:** `UpdateQuestionInput`

### deleteQuestion

Deletes a question from a campaign.

**Parameters:**

- `id`: string - The ID of the question to delete

### submitReview

Submits a new review with answers.

**Input Type:** `SubmitReviewInput`

### updateReview

Updates an existing review.

**Input Type:** `UpdateReviewInput`

## GraphQL Queries

### getReviewCampaigns

Gets all review campaigns for an event.

**Parameters:**

- `eventId`: string - The ID of the event

### getReviewCampaign

Gets a specific review campaign with questions and reviews.

**Parameters:**

- `id`: string - The ID of the campaign

### getReviewCampaignsForUser

Gets campaigns available to a user based on their ticket type.

**Parameters:**

- `eventId`: string - The ID of the event
- `ticketType`: string (optional) - The user's ticket type

### getReviewsForCampaign

Gets all reviews for a campaign.

**Parameters:**

- `campaignId`: string - The ID of the campaign

### getReview

Gets a specific review with answers.

**Parameters:**

- `id`: string - The ID of the review

## Usage Examples

### Creating a Complete Review Campaign

```typescript
// 1. Create the campaign
const campaign = await ReviewCampaign.create({
  title: "Event Feedback 2024",
  description: "Please provide feedback about our event",
  eventId: event,
  for: "all",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-31"),
}).save();

// 2. Add questions
const questions = [
  {
    question: "How would you rate the event?",
    questionType: "range" as const,
    rangeMin: 1,
    rangeMax: 5,
    reviewCampaign: campaign,
  },
  {
    question: "What was your favorite part?",
    questionType: "text" as const,
    reviewCampaign: campaign,
  },
  {
    question: "Would you attend again?",
    questionType: "dropdown" as const,
    reviewCampaign: campaign,
  },
];

for (const questionData of questions) {
  const question = await ReviewQuestion.create(questionData).save();

  if (questionData.questionType === "dropdown") {
    const dropdownOptions = [
      { text: "Yes", value: "yes", reviewQuestion: question },
      { text: "No", value: "no", reviewQuestion: question },
      { text: "Maybe", value: "maybe", reviewQuestion: question },
    ];

    for (const option of dropdownOptions) {
      await DropDown.create(option).save();
    }
  }
}
```

### Modifying a Campaign

```typescript
// Using the modifyReviewCampaign mutation
const modifiedCampaign = await modifyReviewCampaign(
  "campaign-uuid",
  "Updated Event Feedback",
  "Updated description for better feedback collection",
  "ticket_type"
);
```

### Submitting a Review

```typescript
// 1. Create the review
const review = await Review.create({
  reviewCampaign: campaign,
  dateReviewCompleted: new Date(),
}).save();

// 2. Add answers
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

## Database Schema

### review_campaign Table

```sql
CREATE TABLE review_campaign (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    eventId VARCHAR NOT NULL,
    startDate DATETIME,
    endDate DATETIME,
    for VARCHAR DEFAULT 'all',
    for_id VARCHAR,
    dateCreated DATETIME NOT NULL,
    dateModified DATETIME NOT NULL,
    FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
);
```

### review_question Table

```sql
CREATE TABLE review_question (
    id VARCHAR PRIMARY KEY,
    question VARCHAR NOT NULL,
    questionType VARCHAR DEFAULT 'text',
    rangeMin INT,
    rangeMax INT,
    reviewCampaignId VARCHAR NOT NULL,
    createdAt DATETIME NOT NULL,
    modifiedAt DATETIME NOT NULL,
    FOREIGN KEY (reviewCampaignId) REFERENCES review_campaign(id) ON DELETE CASCADE
);
```

### review Table

```sql
CREATE TABLE review (
    id VARCHAR PRIMARY KEY,
    reviewCampaignId VARCHAR NOT NULL,
    dateReviewCompleted DATETIME,
    dateCreated DATETIME NOT NULL,
    FOREIGN KEY (reviewCampaignId) REFERENCES review_campaign(id) ON DELETE CASCADE
);
```

### review_answer Table

```sql
CREATE TABLE review_answer (
    id VARCHAR PRIMARY KEY,
    reviewId VARCHAR NOT NULL,
    questionId VARCHAR NOT NULL,
    questionType VARCHAR NOT NULL,
    textAnswer TEXT,
    rangeAnswer INT,
    dropDownAnswerId VARCHAR,
    createAt DATETIME NOT NULL,
    modifiedAt DATETIME NOT NULL,
    FOREIGN KEY (reviewId) REFERENCES review(id) ON DELETE CASCADE,
    FOREIGN KEY (questionId) REFERENCES review_question(id) ON DELETE CASCADE,
    FOREIGN KEY (dropDownAnswerId) REFERENCES dropdown(id) ON DELETE CASCADE
);
```

### dropdown Table

```sql
CREATE TABLE dropdown (
    id VARCHAR PRIMARY KEY,
    text VARCHAR NOT NULL,
    value VARCHAR NOT NULL,
    reviewQuestionId VARCHAR NOT NULL,
    dateCreated DATETIME NOT NULL,
    dateModified DATETIME NOT NULL,
    FOREIGN KEY (reviewQuestionId) REFERENCES review_question(id) ON DELETE CASCADE
);
```

## Best Practices

1. **Campaign Design:**

   - Use clear, concise titles
   - Provide detailed descriptions
   - Set appropriate date ranges
   - Target the right audience

2. **Question Design:**

   - Keep questions short and clear
   - Use appropriate question types
   - Provide reasonable ranges for numeric questions
   - Include "Other" options in dropdowns when appropriate

3. **Data Management:**

   - Regularly backup review data
   - Archive old campaigns
   - Monitor response rates
   - Analyze feedback trends

4. **Security:**
   - Validate all inputs
   - Implement rate limiting
   - Protect sensitive feedback
   - Use authentication for mutations

## Error Handling

The system includes comprehensive error handling:

- **Campaign not found**: When trying to modify/delete non-existent campaigns
- **Question not found**: When trying to update/delete non-existent questions
- **Invalid input**: When provided data doesn't match expected format
- **Authentication required**: When mutations are called without proper authentication

## Migration

To set up the database tables, run:

```bash
npm run typeorm migration:run
```

This will execute the migration file `1700000000000-CreateReviewTables.ts` to create all necessary tables with proper foreign key relationships.
