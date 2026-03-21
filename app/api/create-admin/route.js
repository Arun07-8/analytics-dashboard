import { adminAuth, adminDb } from '../../../lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { email, password, name, role } = await req.json();
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
        });

        await adminDb.collection('admins').doc(userRecord.uid).set({
            uid: userRecord.uid,
            name,
            email,
            role: role?.trim().toLowerCase() || "admin",
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}