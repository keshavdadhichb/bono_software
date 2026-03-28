import { requirePermission } from "@/lib/api-auth"
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requirePermission("canViewMaster"); if (authCheck) return authCheck;
    const { id } = await params;
    const party = await db.party.findUnique({ where: { id } });

    if (!party) {
      return Response.json({ error: "Party not found" }, { status: 404 });
    }

    return Response.json(party);
  } catch (error) {
    console.error("Failed to fetch party:", error);
    return Response.json(
      { error: "Failed to fetch party" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheckPut = await requirePermission("canEditMaster"); if (authCheckPut) return authCheckPut;
    const { id } = await params;
    const body = await request.json();

    if (!body.partyName || !body.partyType) {
      return Response.json(
        { error: "Party Name and Party Type are required" },
        { status: 400 }
      );
    }

    const party = await db.party.update({
      where: { id },
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

    return Response.json(party);
  } catch (error) {
    console.error("Failed to update party:", error);
    return Response.json(
      { error: "Failed to update party" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheckDel = await requirePermission("canDeleteMaster"); if (authCheckDel) return authCheckDel;
    const { id } = await params;
    await db.party.delete({ where: { id } });
    return Response.json({ message: "Party deleted successfully" });
  } catch (error) {
    console.error("Failed to delete party:", error);
    return Response.json(
      { error: "Failed to delete party" },
      { status: 500 }
    );
  }
}
