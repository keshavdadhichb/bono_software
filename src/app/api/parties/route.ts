import { requirePermission } from "@/lib/api-auth"
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requirePermission("canViewMaster"); if (authCheck) return authCheck;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (type && type !== "All") {
      where.partyType = type;
    }

    const parties = await db.party.findMany({
      where,
      orderBy: { partyName: "asc" },
    });

    return Response.json(parties);
  } catch (error) {
    console.error("Failed to fetch parties:", error);
    return Response.json(
      { error: "Failed to fetch parties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requirePermission("canEditMaster"); if (authCheck) return authCheck;
    const body = await request.json();

    if (!body.partyName || !body.partyType) {
      return Response.json(
        { error: "Party Name and Party Type are required" },
        { status: 400 }
      );
    }

    const party = await db.party.create({
      data: {
        partyName: body.partyName,
        partyType: body.partyType,
        address1: body.address1 || null,
        address2: body.address2 || null,
        address3: body.address3 || null,
        address4: body.address4 || null,
        district: body.district || null,
        state: body.state || null,
        pincode: body.pincode || null,
        phone: body.phone || null,
        mobile: body.mobile || null,
        email: body.email || null,
        gstNo: body.gstNo || null,
        panNo: body.panNo || null,
        bankName: body.bankName || null,
        bankAccountNo: body.bankAccountNo || null,
        bankIfscCode: body.bankIfscCode || null,
        creditDays: body.creditDays ? parseInt(body.creditDays) : 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return Response.json(party, { status: 201 });
  } catch (error) {
    console.error("Failed to create party:", error);
    return Response.json(
      { error: "Failed to create party" },
      { status: 500 }
    );
  }
}
