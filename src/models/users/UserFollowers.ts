import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, UpdateDateColumn, ManyToOne } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Users } from "./User";

@ObjectType()
@Entity()
export class UserFollowers extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field( () => Users)
    @ManyToOne( () => Users, u => u.following, { onDelete: 'CASCADE' })
    user: Users;

    @Field( () => Users )
    @ManyToOne( () => Users, u => u.followers, { onDelete: 'CASCADE' } )
    following: Users;

    @CreateDateColumn()
    created: Date;
}
