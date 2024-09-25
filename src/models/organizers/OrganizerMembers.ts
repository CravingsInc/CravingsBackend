import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, BaseEntity, UpdateDateColumn } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Organizers } from "./Organizers";

@Entity()
@ObjectType()
export class OrganizerMembers extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn( "uuid" )
    id: string;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column()
    email: string;

    @Field()
    @Column()
    title: 'Admin' | "Member" | "Guest";

    @Field()
    password: string;

    @Field()
    @Column({ default: '/home-header.png', nullable: true })
    profilePicture: string;

    @Field( () => Organizers )
    @ManyToOne( () => Organizers, o => o.members, { onDelete: "CASCADE" } )
    organizer: Organizers;

    @Field()
    @CreateDateColumn()
    createdDate: Date;

    @Field()
    @UpdateDateColumn()
    updatedDate: Date;
    
}
