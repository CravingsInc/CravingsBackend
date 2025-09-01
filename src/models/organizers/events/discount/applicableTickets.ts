import { Entity, PrimaryGeneratedColumn,CreateDateColumn, BaseEntity, ManyToOne } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { EventDiscountsCodesRuleset } from "./ruleset";
import { EventTickets } from "../eventTickets";

@Entity()
@ObjectType()
export class DiscountApplicableTickets extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => EventDiscountsCodesRuleset)
    @ManyToOne(() => EventDiscountsCodesRuleset, ruleset => ruleset.applicableTickets, { onDelete: "CASCADE" })
    ruleset: EventDiscountsCodesRuleset;

    @Field(() => EventTickets)
    @ManyToOne(() => EventTickets, ticket => ticket.applicableDiscounts, { onDelete: "CASCADE" })
    ticket: EventTickets;

    @Field()
    @CreateDateColumn()
    createdAt: Date;
}
