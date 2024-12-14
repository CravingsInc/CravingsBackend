import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { OrganizerMembers } from "./OrganizerMembers";

@Entity()
@Entity()
export class OrganizerMemberPasswordChange extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne( () => OrganizerMembers, o => o.passwordChangeHistory, { onDelete: "CASCADE" } )
    member: OrganizerMembers;

    @Column({ default: false })
    tokenUsed: boolean;

    @CreateDateColumn()
    created: Date;
}
