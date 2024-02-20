import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, UpdateDateColumn } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { UserPasswordChange } from "./UserPasswordChange";
import { EventTicketBuys, OrganizersFollowers } from "../organizers";
import { UserFollowers } from "./UserFollowers";
import { OrganizerPageVisit } from "../organizers/analystics/OrganizerPageVisit";

@Entity()
@ObjectType()
export class Users extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column({ unique: true })
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
    @Column({ default: 12, nullable: true })
    searchMilesRadius: number;

    @OneToMany( () => UserPasswordChange, pwc => pwc.user )
    passwordChangeHistory: UserPasswordChange[];

    @Field( () => [ EventTicketBuys ])
    @OneToMany( () => EventTicketBuys, eTB => eTB.user )
    eventTickets: EventTicketBuys[];

    @Field( () => [ UserFollowers ])
    @OneToMany( () => UserFollowers, uF => uF.following)
    followers: UserFollowers[];

    @Field( () => [UserFollowers])
    @OneToMany( () => UserFollowers, uF => uF.user )
    following: UserFollowers[];

    @Field( () => [ OrganizersFollowers ])
    @OneToMany( () => OrganizersFollowers, oF => oF.user)
    organizerFollowing: OrganizersFollowers[];

    @Field( () => [ OrganizerPageVisit ])
    @OneToMany( () => OrganizerPageVisit, oPV => oPV.user )
    organizerPageVisited: OrganizerPageVisit[];

    @Field()
    @CreateDateColumn()
    dateJoined: Date;

    @Field()
    @UpdateDateColumn()
    dateUpdated: Date;

}
