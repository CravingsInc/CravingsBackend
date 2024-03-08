import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./User";

@Entity()
export class UserPasswordChange extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne( () => Users, u => u.passwordChangeHistory, { onDelete: "CASCADE" } )
    user: Users;

    @Column({ default: false })
    tokenUsed: boolean;

    @CreateDateColumn()
    created: Date;
}