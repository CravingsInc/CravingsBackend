import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";

@Entity()
@ObjectType()
export class Users {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    username: string;

    @Field()
    @Column()
    email: string;

    @Column()
    password: string;

    @Field()
    @Column({ default: "", nullable: true })
    firstName: string;

    @Field()
    @Column({ default: "", nullable: true })
    lastName: string;

    @Field()
    @Column({ default: "", nullable: true })
    profilePicture: string;

    @Field()
    @Column({ default: "", nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    stripeCustomerId: string;

    @Field()
    @Column({ default: 0, nullable: true })
    latitude: number;

    @Field()
    @Column({ default: 0, nullable: true })
    longitude: number;

    @Field()
    @CreateDateColumn()
    dateJoined: Date;

}
