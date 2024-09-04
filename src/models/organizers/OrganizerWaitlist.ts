import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";

@Entity()
@ObjectType()
export class OrganizerWaitlist extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    firstName: string;

    @Field()
    @Column()
    lastName: string;

    @Field()
    @Column()
    email: string;

    @Field()
    @Column()
    phoneNumber: string;

    @Field()
    @CreateDateColumn()
    createdDate: Date;
}