import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateReviewTables1700000000000 implements MigrationInterface {
    name = 'CreateReviewTables1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ReviewCampaign table
        await queryRunner.createTable(
            new Table({
                name: "review_campaign",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        isPrimary: true,
                        generationStrategy: "uuid"
                    },
                    {
                        name: "title",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "description",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "eventId",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "startDate",
                        type: "datetime",
                        isNullable: true
                    },
                    {
                        name: "endDate",
                        type: "datetime",
                        isNullable: true
                    },
                    {
                        name: "for",
                        type: "varchar",
                        default: "'all'"
                    },
                    {
                        name: "for_id",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "dateCreated",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "dateModified",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    }
                ]
            })
        );

        // Create ReviewQuestion table
        await queryRunner.createTable(
            new Table({
                name: "review_question",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        isPrimary: true,
                        generationStrategy: "uuid"
                    },
                    {
                        name: "question",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "questionType",
                        type: "varchar",
                        default: "'text'"
                    },
                    {
                        name: "rangeMin",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "rangeMax",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "reviewCampaignId",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "createdAt",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "modifiedAt",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    }
                ]
            })
        );

        // Create DropDown table
        await queryRunner.createTable(
            new Table({
                name: "drop_down",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        isPrimary: true,
                        generationStrategy: "uuid"
                    },
                    {
                        name: "text",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "value",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "reviewQuestionId",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "dateCreated",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "dateModified",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    }
                ]
            })
        );

        // Create Review table
        await queryRunner.createTable(
            new Table({
                name: "review",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        isPrimary: true,
                        generationStrategy: "uuid"
                    },
                    {
                        name: "reviewCampaignId",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "dateReviewCompleted",
                        type: "datetime",
                        isNullable: true
                    },
                    {
                        name: "dateCreated",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP"
                    }
                ]
            })
        );

        // Create ReviewAnswer table
        await queryRunner.createTable(
            new Table({
                name: "review_answer",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        isPrimary: true,
                        generationStrategy: "uuid"
                    },
                    {
                        name: "reviewId",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "questionId",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "questionType",
                        type: "varchar",
                        default: "'text'"
                    },
                    {
                        name: "textAnswer",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "rangeAnswer",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "dropDownAnswerId",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "createAt",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "modifiedAt",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    }
                ]
            })
        );

        // Add foreign key constraints
        await queryRunner.createForeignKey(
            "review_question",
            new TableForeignKey({
                columnNames: ["reviewCampaignId"],
                referencedColumnNames: ["id"],
                referencedTableName: "review_campaign",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "drop_down",
            new TableForeignKey({
                columnNames: ["reviewQuestionId"],
                referencedColumnNames: ["id"],
                referencedTableName: "review_question",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "review",
            new TableForeignKey({
                columnNames: ["reviewCampaignId"],
                referencedColumnNames: ["id"],
                referencedTableName: "review_campaign",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "review_answer",
            new TableForeignKey({
                columnNames: ["reviewId"],
                referencedColumnNames: ["id"],
                referencedTableName: "review",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "review_answer",
            new TableForeignKey({
                columnNames: ["questionId"],
                referencedColumnNames: ["id"],
                referencedTableName: "review_question",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "review_answer",
            new TableForeignKey({
                columnNames: ["dropDownAnswerId"],
                referencedColumnNames: ["id"],
                referencedTableName: "drop_down",
                onDelete: "SET NULL"
            })
        );

        await queryRunner.createForeignKey(
            "review_campaign",
            new TableForeignKey({
                columnNames: ["eventId"],
                referencedColumnNames: ["id"],
                referencedTableName: "events",
                onDelete: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        const reviewAnswerTable = await queryRunner.getTable("review_answer");
        const reviewTable = await queryRunner.getTable("review");
        const dropDownTable = await queryRunner.getTable("drop_down");
        const reviewQuestionTable = await queryRunner.getTable("review_question");
        const reviewCampaignTable = await queryRunner.getTable("review_campaign");

        if (reviewAnswerTable) {
            const foreignKeys = reviewAnswerTable.foreignKeys;
            await Promise.all(
                foreignKeys.map(foreignKey => queryRunner.dropForeignKey("review_answer", foreignKey))
            );
        }

        if (reviewTable) {
            const foreignKeys = reviewTable.foreignKeys;
            await Promise.all(
                foreignKeys.map(foreignKey => queryRunner.dropForeignKey("review", foreignKey))
            );
        }

        if (dropDownTable) {
            const foreignKeys = dropDownTable.foreignKeys;
            await Promise.all(
                foreignKeys.map(foreignKey => queryRunner.dropForeignKey("drop_down", foreignKey))
            );
        }

        if (reviewQuestionTable) {
            const foreignKeys = reviewQuestionTable.foreignKeys;
            await Promise.all(
                foreignKeys.map(foreignKey => queryRunner.dropForeignKey("review_question", foreignKey))
            );
        }

        if (reviewCampaignTable) {
            const foreignKeys = reviewCampaignTable.foreignKeys;
            await Promise.all(
                foreignKeys.map(foreignKey => queryRunner.dropForeignKey("review_campaign", foreignKey))
            );
        }

        // Drop tables
        await queryRunner.dropTable("review_answer");
        await queryRunner.dropTable("review");
        await queryRunner.dropTable("drop_down");
        await queryRunner.dropTable("review_question");
        await queryRunner.dropTable("review_campaign");
    }
}
