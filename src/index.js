const ALLOWED_ORIGINS = new Set([
  "https://intake.stone-crafters.com",
  "https://project-intake-form.scorderdesk.workers.dev"
]);

const BOARD_ID = "18418995265";
const GROUP_ID = "group_mm4ktsx2";
const API_VERSION = "2026-07";

function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.has(origin)
    ? origin
    : "https://intake.stone-crafters.com";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(data, status = 200, origin = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin)
    }
  });
}

async function geocodeAddress(address) {
  try {
    const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(address);
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "Stone-Crafters-Project-Intake/1.0"
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return { address };
    const data = await response.json();
    if (Array.isArray(data) && data.length) {
      return {
        address,
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon)
      };
    }
  } catch (_) {
    // Geocoding is optional. The lead should still be submitted.
  }
  return { address };
}

async function mondayRequest(token, query, variables) {
  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token,
      "API-Version": API_VERSION
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15000)
  });

  let body;
  try {
    body = await response.json();
  } catch (_) {
    throw new Error(`monday.com returned HTTP ${response.status}`);
  }

  if (!response.ok || body.errors?.length) {
    const message = body.errors?.map((e) => e.message).join("; ") || `monday.com returned HTTP ${response.status}`;
    throw new Error(message);
  }

  return body.data;
}

function validatePayload(p) {
  const required = ["jobName", "projectAddress", "projectType", "email", "projectDetails"];
  for (const key of required) {
    if (typeof p?.[key] !== "string" || !p[key].trim()) {
      return `${key} is required.`;
    }
  }

  if (typeof p.email !== "string" || !/^\S+@\S+\.\S+$/.test(p.email.trim())) {
    return "Please enter a valid email address.";
  }

  if (p.isContractor !== true && p.isContractor !== false) {
    return "Please select whether you are a Contractor or Private Client.";
  }

  if (p.isContractor && (!p.contractorCompany?.trim() || !p.contractorName?.trim())) {
    return "Please enter your company name and your name.";
  }

  return null;
}

async function handleSubmit(request, env) {
  const origin = request.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json({ success: false, message: "Request origin not allowed." }, 403, origin);
  }

  if (!env.MONDAY_API_TOKEN) {
    console.error("MONDAY_API_TOKEN secret is not configured.");
    return json({ success: false, message: "The form is not configured yet. Please try again later." }, 500, origin);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (_) {
    return json({ success: false, message: "Invalid form submission." }, 400, origin);
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return json({ success: false, message: validationError }, 400, origin);
  }

 const locationData = await geocodeAddress(payload.projectAddress.trim());

const projectTypeIds = {
  "kitchen countertops": 1,
  "shower walls": 2,
  "fireplace surround": 3,
  "outdoor kitchen": 4,
  "tile work": 5,
  "lvp flooring": 6,
  "tile backsplash": 7,
  "counter tops": 8,
  "bathroom remodel": 9,
  "full height backsplash": 10,
  "other": 11
};

const selectedProjectType = payload.projectType.trim().toLowerCase();
const projectTypeId = projectTypeIds[selectedProjectType];

if (!projectTypeId) {
  throw new Error(`Invalid project type: ${payload.projectType}`);
}

const columnValues = {
  location_mm4n35jn: locationData.lat !== undefined
    ? { address: locationData.address, lat: locationData.lat, lng: locationData.lng }
    : { address: locationData.address },

  dropdown_mm4kwhfn: {
    ids: [projectTypeId],
    override_all_ids: "true"
  },

 const locationData = await geocodeAddress(payload.projectAddress.trim());

const projectTypeIds = {
  "kitchen countertops": 1,
  "shower walls": 2,
  "fireplace surround": 3,
  "outdoor kitchen": 4,
  "tile work": 5,
  "lvp flooring": 6,
  "tile backsplash": 7,
  "counter tops": 8,
  "bathroom remodel": 9,
  "full height backsplash": 10,
  "other": 11
};

const selectedProjectType = payload.projectType.trim().toLowerCase();
const projectTypeId = projectTypeIds[selectedProjectType];

if (!projectTypeId) {
  throw new Error(`Invalid project type: ${payload.projectType}`);
}

const columnValues = {
  location_mm4n35jn: locationData.lat !== undefined
    ? { address: locationData.address, lat: locationData.lat, lng: locationData.lng }
    : { address: locationData.address },

  dropdown_mm4kwhfn: {
    ids: [projectTypeId],
    override_all_ids: "true"
  },

  single_select9eisr7g: {
    index: payload.isContractor ? 0 : 1
  },

  emailo36r19pa: {
    email: payload.email.trim(),
    text: payload.email.trim()
  },

  color_mm4knkkm: {
    index: 7
  },

  color_mm5gjq4b: {
    index: payload.isContractor ? 6 : 7
  }
};
  }
};const createItemMutation = `
    mutation CreateLead($boardId: ID!, $groupId: String!, $itemName: String!, $colVals: JSON!) {
      create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $colVals) {
        id
        name
        url
      }
    }
  `;

  let item;
  try {
    const data = await mondayRequest(env.MONDAY_API_TOKEN, createItemMutation, {
      boardId: BOARD_ID,
      groupId: GROUP_ID,
      itemName: payload.jobName.trim(),
      colVals: JSON.stringify(columnValues)
    });
    item = data?.create_item;
  } catch (error) {
    console.error("Monday create_item failed:", error.message);
    return json({ success: false, message: "MONDAY_ERROR: " + error.message }, 200, origin);
  }
  if (!item?.id) {
    console.error("Monday create_item returned no item ID.");
    return json({ success: false, message: "We couldn't confirm the project submission. Please try again." }, 502, origin);
  }

  const noteLines = [];
  if (payload.isContractor) {
    noteLines.push("🏗️ CONTRACTOR INFO");
    noteLines.push("Company: " + payload.contractorCompany.trim());
    noteLines.push("Contact: " + payload.contractorName.trim());
    noteLines.push("");
  }
  if (payload.phone?.trim()) noteLines.push("📞 Phone: " + payload.phone.trim());
  noteLines.push("📧 Email: " + payload.email.trim());
  noteLines.push("📍 Address: " + payload.projectAddress.trim());
  noteLines.push("");
  noteLines.push("📋 Project Details:");
  noteLines.push(payload.projectDetails.trim());

  const noteMutation = `
    mutation AddNote($itemId: ID!, $body: String!) {
      create_update(item_id: $itemId, body: $body) { id }
    }
  `;

  try {
    await mondayRequest(env.MONDAY_API_TOKEN, noteMutation, {
      itemId: item.id,
      body: noteLines.join("\n")
    });
  } catch (error) {
    // The lead itself was created. Do not tell the customer the whole submission failed.
    console.error("Monday create_update failed for item", item.id, error.message);
  }

  return json({ success: true, itemId: item.id }, 200, origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request.headers.get("Origin")) });
    }

    if (url.pathname === "/api/submit-lead") {
      if (request.method !== "POST") {
        return json({ success: false, message: "Method not allowed." }, 405, request.headers.get("Origin"));
      }
      return handleSubmit(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
