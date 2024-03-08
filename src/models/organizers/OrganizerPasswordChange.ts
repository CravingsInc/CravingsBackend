import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Organizers } from "./Organizers";


@Entity()
@Entity()
export class OrganizerPasswordChange extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne( () => Organizers, o => o.passwordChangeHistory, { onDelete: "CASCADE" } )
    organizer: Organizers;

    @Column({ default: false })
    tokenUsed: boolean;

    @CreateDateColumn()
    created: Date;
}