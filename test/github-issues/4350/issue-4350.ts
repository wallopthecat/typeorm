import "reflect-metadata";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Post1, TestEnum1} from "./entity/Post1";
import {Post2, TestEnum2} from "./entity/Post2";
import {Connection, Repository} from "../../../src";
import {expect} from "chai";

describe("github issues > #4350 Array of enums column doesn't work at all", () => {
    let connections: Connection[];
    after(() => closeTestingConnections(connections));

    it("should migrate postgres enums correctly", async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/Post1{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["postgres"]
        });
        let connection = connections[0];

        let repo: Repository<Post1 | Post2> = connection.getRepository(Post1);

        let post: Post1 | Post2 = new Post1();
        post.testEnum = [TestEnum1.VALUE1];

        post = await repo.save(post);

        post.id.should.exist;
        post.testEnum.should.be.an("array").that.includes(TestEnum1.VALUE1);

        await connection.close();

        connections = await createTestingConnections({
            entities: [__dirname + "/entity/Post2{.js,.ts}"],
            schemaCreate: true,
            dropSchema: false,
            enabledDrivers: ["postgres"]
        });

        connection = connections[0];

        repo = connection.getRepository(Post2);

        post = await repo.findOne(post.id) as Post2;

        expect(post).to.exist;
        post.testEnum = [...post.testEnum, TestEnum2.VALUE2];

        post = await repo.save(post);

        post.id.should.exist;
        post.testEnum.should.be.an("array").that.includes(TestEnum2.VALUE1).and.that.includes(TestEnum2.VALUE2);
    });
});
