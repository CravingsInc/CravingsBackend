import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, UpdateDateColumn } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Events } from "./events";
import { OrganizerPasswordChange } from "./OrganizerPasswordChange";
import { OrganizersFollowers } from "./OrganizersFollowers";
import { OrganizerPageVisit } from "./analystics/OrganizerPageVisit";


@Entity()
@ObjectType()
export class Organizers extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    email: string;

    @Column()
    password: string;

    @Field()
    @Column({ default: "", nullable: true })
    orgName: string;

    @Field()
    @Column({ default: "", nullable: true })
    profilePicture: string;

    @Field()
    @Column({ default: "", nullable: true })
    banner: string;

    @Field()
    @Column({ default: "", nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    stripeConnectId: string;

    @Column({ default: false })
    stripeAccountVerified: boolean;

    @Field()
    @Column({ default: 0, nullable: true })
    latitude: number;

    @Field()
    @Column({ default: 0, nullable: true })
    longitude: number;

    @Field()
    @Column({ default: '' })
    location: string;

    @OneToMany( () => OrganizerPasswordChange, pwc => pwc.organizer )
    passwordChangeHistory: OrganizerPasswordChange[];

    @Field( () => [ OrganizersFollowers ])
    @OneToMany( () => OrganizersFollowers, oF => oF.organizer)
    followers: OrganizersFollowers[];

    @Field( () => [ OrganizerPageVisit ])
    @OneToMany( () => OrganizerPageVisit, oPV => oPV.organizer )
    pageVisitors: OrganizerPageVisit[]; 

    @Field( () => [Events] )
    @OneToMany( () => Events, e => e.organizer )
    events: Events[];

    @Field()
    @CreateDateColumn()
    createdDate: Date;

    @Field()
    @UpdateDateColumn()
    updatedDate: Date;

}
