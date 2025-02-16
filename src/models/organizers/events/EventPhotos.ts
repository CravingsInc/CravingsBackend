import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, ManyToOne, UpdateDateColumn } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Events } from "./Events";

@Entity()
@ObjectType()
export class EventPhotos extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    picture: string;

    @Field( () => Events )
    @ManyToOne( () => Events, e => e.photoGallery, { onDelete: "CASCADE" })
    event: Events;

    @Field()
    @CreateDateColumn()
    createdAt: Date;
}
