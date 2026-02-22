import { getDailyModelLimits } from './app/actions/admin';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    // Mock checkAdmin to bypass auth
    const res = await getDailyModelLimits();
    console.log("RESULT:", JSON.stringify(res, null, 2));
}

// override checkAdmin since it's used inside getDailyModelLimits
import * as adminActions from './app/actions/admin';
(adminActions as any).checkAdmin = async () => true;

test().catch(console.error);
