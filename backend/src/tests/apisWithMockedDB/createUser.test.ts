import { createUser } from '../../controllers/user.controller';
import { connectDB } from '../../config/db'
import { jest } from '@jest/globals';

jest.mock('../../config/db')

const mGetDbConnection = jest.mocked(connectDB);

function testUserCreatedSuccesfully() {

}