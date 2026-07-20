const mainContainer = document.getElementById("container");
let fieldLabel = document.getElementById("fieldLabel");
const addSubFormButton = document.getElementById("addSubForm");
const nameInput = document.getElementById("name");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const clientPriceInput = document.getElementById("client-price");
const vendorPriceInput = document.getElementById("vendor-price");
const tableContainer = document.getElementById("table-container");
let addRowButton = document.getElementById("addRow");
const dataContainer = document.getElementById("data-container");
let table;
let tableBody;

let firstSelectedContractOpsUserEmail;

// Notify toggle state - default false
let notifyTeam = "false";
let MassWidgetUpdateExistingData = [];
let MassWidgetUpdateJSON;
let NoSqlTableCount;

// Store selected file for upload
let selectedFileForUpload = null;

// Contracts: field API name → API key to store WorkDrive URL
const CONTRACTS_FILE_FIELD_MAP = {
  PO_Attachment: "PO_URL",
  Billing_Attachments_Upload: "Billing_Attachment_URL",
};

// Accounts: field API name → API key to store WorkDrive URL
const ACCOUNTS_FILE_FIELD_MAP = {
  Site_Map_Attachment: "Site_Link",
};

// Bids: field API name → API key to store WorkDrive URL
const BIDS_FILE_FIELD_MAP = {
  Bid_Docs_Upload: "URL",
  Supporting_Docs_Upload: "Supporting_Docs_URL",
};

// Deals [Sow]: field API name → API key to store WorkDrive URL
const DEALS_FILE_FIELD_MAP = {
  Vendor_Specific_Attachments: "Vendor_Specific_Attachments_URL",
  Client_PO_Attachment: "Client_PO_URL",
  Site_Map: "SiteMap_URL",
  Billing_Attachment_Upload: "Billing_Attachment_URL",
};

// Vendors: field API name → API key to store WorkDrive URL
const VENDORS_FILE_FIELD_MAP = {
  Bank_ACH_Team_Upload: "Bank_ACH",
  Certificate_of_Insurance_Team_upload: "Certificate_of_Insurance",
  W9: "W9_URL",
  Workers_Comp_Team_Upload: "Workers_Compensation",
};

// ServiceCompletions: field API name → API key to store WorkDrive URL
const SERVICE_COMPLETIONS_FILE_FIELD_MAP = {
  Form_1_File_Upload: "Form_1_Url",
  Form_2_File_Upload: "Form_2_Url",
  Form_3_File_Upload: "Form_3_Url",
  Upload_Files: "Uploaded_File_URL",
};

// Vendor_Invoices: field API name → API key to store WorkDrive URL
const VENDOR_INVOICES_FILE_FIELD_MAP = {
  Document_1: "Document_1_URL",
  Document_2: "Document_2_URL",
  Document_3: "Document_3_URL",
  Invoice_Upload: "InvoiceUrl",
};

// Unified map: module name → (field API name → store-in API key). Used for file picker + WorkDrive URL storage.
const MODULE_FILE_FIELD_MAPS = {
  Contracts: CONTRACTS_FILE_FIELD_MAP,
  Accounts: ACCOUNTS_FILE_FIELD_MAP,
  Bids: BIDS_FILE_FIELD_MAP,
  Deals: DEALS_FILE_FIELD_MAP,
  Vendors: VENDORS_FILE_FIELD_MAP,
  ServiceCompletions: SERVICE_COMPLETIONS_FILE_FIELD_MAP,
  Vendor_Invoices: VENDOR_INVOICES_FILE_FIELD_MAP,
};

ZOHO.embeddedApp.on("PageLoad", async function (entity) {
  // console.log(entity, "entity");
  const { EntityId, Entity } = entity;
  let module = Entity;
  // console.log(module);

  if (module == "Contracts") {
    const firstSelectedContract = await ZOHO.CRM.API.getRecord({
      Entity: "Contracts",
      approved: "both",
      RecordID: EntityId[0],
    });

    const firstSelectedContractOpsId = firstSelectedContract.data[0]?.Operations_Associate?.id;
    const firstSelectedContractOpsUser = await ZOHO.CRM.API.getUser({
      ID: firstSelectedContractOpsId,
    });
    // console.log("firstSelectedContractOpsUser", firstSelectedContractOpsUser);

    firstSelectedContractOpsUserEmail = firstSelectedContractOpsUser?.users[0]?.email;
    // console.log(firstSelectedContractOpsUserEmail)
  }

  const loadingIndicator = createLoadingSpinner();
  let choicesInstance;
  mainContainer.appendChild(loadingIndicator);

  // Setup notify toggle button
  const notifyToggle = document.getElementById("notifyToggle");
  if (notifyToggle) {
    notifyToggle.addEventListener("click", function (e) {
      e.preventDefault();
      notifyTeam = notifyTeam === "false" ? "true" : "false";

      const button = this;
      const span = button.querySelector("span");

      if (notifyTeam === "true") {
        button.classList.remove("bg-gray-300");
        button.classList.add("bg-indigo-600");
        span.style.marginLeft = "30px";
      } else {
        button.classList.remove("bg-indigo-600");
        button.classList.add("bg-gray-300");
        span.style.marginLeft = "4px";
      }

      // console.log("Notify Team:", notifyTeam);
    });
  }

  addSubFormButton.addEventListener("click", async () => {
    const modal = document.getElementById("modal");
    modal.classList.add("hidden");
  });

  document.getElementById(`updateForm`).addEventListener("submit", async function (e) {
    e.preventDefault();

    const selectedValue = choicesInstance.getValue(true);
    if (!selectedValue) {
      showError("Please select a field.");
      return;
    }

    const updateButton = document.getElementById("updateButton");
    updateButton.disabled = true;
    updateButton.innerHTML =
      '<div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div> Updating...';

    const fieldSelect = document.getElementById("fieldSelect");
    const fieldApiName = fieldSelect.value;
    const fieldType = fieldSelect.options[fieldSelect.selectedIndex].dataset.type;

    // Check if file upload is needed (fileupload type or any module's mapped file field)
    let newValue;
    const isMappedFileField =
      Entity in MODULE_FILE_FIELD_MAPS && fieldApiName in MODULE_FILE_FIELD_MAPS[Entity];
    if (fieldType === "fileupload" || isMappedFileField) {
      if (!selectedFileForUpload) {
        showError("Please select a file to upload.");
        updateButton.disabled = false;
        updateButton.innerHTML = "Update Record";
        return;
      }

      // Upload file to WorkDrive first
      updateButton.innerHTML =
        '<div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div> Uploading file...';

      try {
        // const fileUrl = await uploadFileToWorkDrive(
        //   selectedFileForUpload,
        //   Entity
        // );
        const config = {
          CONTENT_TYPE: "multipart",
          PARTS: [
            {
              headers: { "Content-Disposition": "file;" },
              content: "__FILE__",
            },
          ],
          FILE: {
            fileParam: "content",
            file: selectedFileForUpload,
          },
        };

        const uploadFileData = await ZOHO.CRM.API.uploadFile(config);
        const fileId = uploadFileData?.data?.[0]?.details?.id;
        newValue = fileId;
        showSuccess("File uploaded to WorkDrive successfully");
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        showError("Failed to upload file: " + (uploadError.message || "Unknown error"));
        updateButton.disabled = false;
        updateButton.innerHTML = "Update Record";
        return;
      }
    } else {
      const fieldValueElement = document.getElementById("fieldValue");
      newValue = fieldValueElement ? fieldValueElement.value : "";
    }

    //   console.log(fieldType, "fieldType");
    // console.log(newValue, "newValue");

    let newProductsData;
    let moduleData;
    // console.log("moduleData ==>", moduleData)

    const req_data = {
      arguments: JSON.stringify({
        ids: EntityId,
        moduleName: Entity,
      }),
    };
    let response = await ZOHO.CRM.FUNCTIONS.execute("getModuleWithIDsAndName", req_data);
    // console.log("response==>", response)
    let data = JSON.parse(response.details.output);

    if (fieldType === "subform" && (module === "Contracts" || module === "Deals")) {
      const req_data = {
        arguments: JSON.stringify({
          ids: EntityId,
          moduleName: Entity,
        }),
      };
      let response = await ZOHO.CRM.FUNCTIONS.execute("getModuleWithIDsAndName", req_data);

      let data = JSON.parse(response.details.output);
      // console.log(data);
      moduleData = data;
      if (!tableBody || tableBody.children.length === 0) {
        showError("No products to update!");
        addSubFormButton.innerHTML = "Add SubForm";
        addSubFormButton.disabled = false;
        updateButton.disabled = false;
        updateButton.innerHTML = "Update Record";
        return;
      }

      newProductsData = Array.from(tableBody.children).map((row) => {
        let cells = row.children;
        return {
          OurServices: cells[0].dataset.productId,
          Start_Date: cells[1].textContent.trim(),
          End_Date: cells[2].textContent.trim(),
          Invoice_Price: cells[3].textContent.trim(),
          Vendor_Price: cells[4].textContent.trim(),
        };
      });
      // console.log(newProductsData, "newProductsData");
    }

    // Format value based on field type
    if (fieldType === "multiselectpicklist") {
      newValue = Array.from(document.getElementById("fieldValue").selectedOptions).map(
        (option) => option.value,
      );
    } else if (fieldType === "boolean") {
      newValue = newValue === "true";
    }

    const totalRecords = entity?.EntityId.length;
    let successCount = 0;
    let failureCount = 0;

    // Create update log JSON for each record
    for (const id of entity?.EntityId) {
      console.log("RecordID", id);
      // const valueForThisRecord = newValue;
      // Fetch existing MassWidgetUpdate data for this record
      if (module === "Contracts") {
        try {
          const recordResp = await ZOHO.CRM.API.getRecord({
            Entity: module,
            RecordID: id,
          });

          const existingValue = recordResp?.data?.[0]?.MassWidgetUpdate;

          if (existingValue) {
            MassWidgetUpdateExistingData = JSON.parse(existingValue);
            // Ensure it's an object (not an array)
            if (
              !MassWidgetUpdateExistingData ||
              typeof MassWidgetUpdateExistingData !== "object" ||
              Array.isArray(MassWidgetUpdateExistingData)
            ) {
              MassWidgetUpdateExistingData = {};
            }
          } else {
            MassWidgetUpdateExistingData = {};
          }
        } catch (e) {
          console.warn("Failed to fetch existing MassWidgetUpdate, continuing fresh");
          MassWidgetUpdateExistingData = {};
        }

        // Get today's date in YYYY-MM-DD format
        const now = new Date();
        const localDateKey =
          now.getFullYear() +
          "-" +
          String(now.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(now.getDate()).padStart(2, "0");
        let hours = now.getHours();
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");

        const localDateTime =
          now.getFullYear() +
          "-" +
          String(now.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(now.getDate()).padStart(2, "0") +
          "T" +
          String(hours).padStart(2, "0") +
          ":" +
          minutes +
          ":" +
          seconds;
        // + " ";
        // + ampm;

        MassWidgetUpdateJSON = {
          Field: fieldApiName,
          Value: newValue,
          LetTeamKnow: notifyTeam,
          DateTime: localDateTime,
        };

        // Initialize date key if it doesn't exist
        if (!MassWidgetUpdateExistingData[localDateKey]) {
          MassWidgetUpdateExistingData[localDateKey] = [];
        }

        // Push new log to today's array
        MassWidgetUpdateExistingData[localDateKey].push(MassWidgetUpdateJSON);
      }

      //  widget update count
      NoSqlTableCount = data?.[id]?.MassWidgetUpdateCount;
      let previousCount = parseInt(NoSqlTableCount, 10);
      if (isNaN(previousCount)) {
        previousCount = 0;
      }

      let updatedCount = previousCount + 1;

      try {
        const updateData = {
          id: id,
          Record_Changed_Today: true,
          Updated_By_Widget: false,
          MassWidgetUpdateCount: updatedCount,
          MassWidgetUpdate: JSON.stringify(MassWidgetUpdateExistingData),
        };
        if (fieldType === "subform" && (module === "Contracts" || module === "Deals")) {
          console.log(moduleData, "moduleData");
          console.log(newProductsData, "newProductsData");
          console.log(fieldApiName, "fieldApiName");

          let existingData = moduleData[id];
          console.log(existingData);

          let existingSubForm = [];
          let subFormField = "";

          if (Entity === "Deals") {
            existingSubForm = existingData.Scope_of_Work || [];
            subFormField = "Scope_of_Work";
          } else if (Entity === "Contracts") {
            existingSubForm = existingData.Our_Services_SubForm || [];
            subFormField = "Our_Services_SubForm";
          } else {
            showError(`Unsupported entity type: ${Entity}`);
            continue;
          }

          newProductsData.forEach((newProduct) => {
            let matchFound = false;

            existingSubForm = existingSubForm.map((existingProduct) => {
              if (existingProduct?.OurServices?.id == newProduct?.OurServices) {
                const isValidStartDate = (productVal) =>
                  productVal !== null &&
                  productVal !== undefined &&
                  productVal !== "null" &&
                  productVal !== "N/A" &&
                  productVal !== "";

                const finalStartDate =
                  isValidStartDate(newProduct.Start_Date) ?
                    newProduct.Start_Date
                  : existingProduct.Start_Date || null;

                const finalEndDate =
                  isValidStartDate(newProduct.End_Date) ?
                    newProduct.End_Date
                  : existingProduct.End_Date || null;

                const finalClientPrice =
                  isValidStartDate(newProduct.Invoice_Price) ?
                    newProduct.Invoice_Price
                  : existingProduct.Invoice_Price || null;

                const finalVendorPrice =
                  isValidStartDate(newProduct.Vendor_Price) ?
                    newProduct.Vendor_Price
                  : existingProduct.Vendor_Price || null;

                matchFound = true;
                return {
                  ...existingProduct,
                  ...newProduct,
                  Start_Date: finalStartDate,
                  End_Date: finalEndDate,
                  Invoice_Price: finalClientPrice,
                  Vendor_Price: finalVendorPrice,
                };
              }
              return existingProduct;
            });

            if (!matchFound) {
              const cleanedProduct = { ...newProduct };
              for (const key in cleanedProduct) {
                if (
                  cleanedProduct[key] === "N/A" ||
                  cleanedProduct[key] === "null" ||
                  cleanedProduct[key] === ""
                ) {
                  delete cleanedProduct[key];
                }
              }

              existingSubForm.push({
                OurServices: { id: newProduct.OurServices },
                ...cleanedProduct,
              });
            }
          });

          console.log(existingSubForm);
          // newValue = existingSubForm;
          updateData[subFormField] = existingSubForm;
        } else if (fieldType === "boolean") {
          boolValue = document.getElementById("fieldValue").checked;
          updateData[fieldApiName] = boolValue;
        } else if (fieldApiName === "Bid_Docs_Upload") {
          // NEW behavior for Bid Docs
          updateData["URL"] = newValue;
        } else if (
          Entity in MODULE_FILE_FIELD_MAPS &&
          fieldApiName in MODULE_FILE_FIELD_MAPS[Entity]
        ) {
          const config = {
            CONTENT_TYPE: "multipart",
            PARTS: [
              {
                headers: { "Content-Disposition": "file;" },
                content: "__FILE__",
              },
            ],
            FILE: {
              fileParam: "content",
              file: selectedFileForUpload,
            },
          };

          const uploadFileData = await ZOHO.CRM.API.uploadFile(config);
          const fileIdForThisRecord = uploadFileData?.data?.[0]?.details?.id;

          if (!fileIdForThisRecord) {
            throw new Error(`Failed to upload file for record ${id}`);
          }

          const rec = await ZOHO.CRM.API.getRecord({
            Entity: module,
            RecordID: id,
            approved: "both",
          });
          const existingFiles = rec?.data?.[0]?.[fieldApiName] || [];
          const fileOps = [];
          // existing files mark for delete
          for (const f of existingFiles) {
            const oldAttachmentId = f.attachment_Id || f.attachment_id;
            if (oldAttachmentId) {
              fileOps.push({ attachment_id: oldAttachmentId, _delete: null });
            }
          }

          // new uploaded file add
          fileOps.push({ file_id: fileIdForThisRecord });
          updateData[fieldApiName] = fileOps;

          console.log("existingFiles", existingFiles);
          console.log("fileOps", fileOps);
          console.log("updateData", updateData);
        } else {
          console.log("value is updating except subform, boolean and fileupload type");
          updateData[fieldApiName] = newValue;
        }

        // console.log(updateData, "updateData");

        ZOHO.CRM.API.getRecord({
          Entity: module,
          approved: "both",
          RecordID: id,
        }).then(function (data) {
          console.log("before updated:", data);
        });

        const updateResponse = await ZOHO.CRM.API.updateRecord({
          Entity: module,
          APIData: updateData,
          Trigger: ["workflow"],
        });

        console.log("Record update response:", updateResponse);

        ZOHO.CRM.API.getRecord({
          Entity: module,
          approved: "both",
          RecordID: id,
        }).then(function (data) {
          console.log("after updated:", data);
        });

        // Execute catalyst function only after successful update
        const sortKey = `data-${updatedCount}`;
        if (updateResponse.data[0].code === "SUCCESS") {
          const req_data = {
            arguments: JSON.stringify({
              entityId: id,
              letTeamKnow: notifyTeam,
              fieldName: MassWidgetUpdateJSON?.Field,
              fieldValue: MassWidgetUpdateJSON?.Value,
              currentDate: MassWidgetUpdateJSON?.DateTime,
              SortKey: sortKey,
              RecordName: data?.[id]?.Name || "Unknown",
            }),
          };

          let response = await ZOHO.CRM.FUNCTIONS.execute("NotificationCatalystDB", req_data);

          // console.log("catalyst response ==>", response);
        }

        if (tableBody) {
          tableBody.innerHTML = "";
          table.classList.add("hidden");
          addSubFormButton.style.display = "none";
        }
        if (updateResponse.data[0].code === "SUCCESS") {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        console.error(`Error processing record ${id}:`, error);
        showError(`Failed to update record ${id}`);
        updateButton.disabled = false;
        updateButton.innerHTML = "Update Record";
        failureCount++;
      }
    }

    showSuccess(
      `Update completed. Total: ${totalRecords}, Success: ${successCount}, Failures: ${failureCount}`,
    );

    const container = document.getElementById("fieldValueContainer");
    // Reset selected file
    selectedFileForUpload = null;
    loadFields(module).then(() => {
      // Destroy old instance if exists
      if (choicesInstance) {
        choicesInstance.destroy();
      }
      choicesInstance = new Choices("#fieldSelect", {
        searchEnabled: true,
        itemSelectText: "",
        shouldSort: false,
      });
    });
    container.innerHTML = `<input type="text" id="fieldValue" required
                    class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">`;
    updateButton.disabled = false;
    updateButton.innerHTML = "Update Record";
  });

  setTimeout(() => {
    loadingIndicator.style.display = "none";
    dataContainer.classList.remove("hidden");

    document
      .querySelectorAll("#data-container > div")
      .forEach((div) => div.classList.add("hidden"));

    switch (module) {
      case "Contacts":
        document.getElementById("heading").innerText = "People Update";
        break;
      case "Products":
        document.getElementById("heading").innerText = "Our Services Update";
        break;
      case "Fleet_Units":
        document.getElementById("heading").innerText = "Fleet Units Update";
        break;
      case "FleetWashs":
        document.getElementById("heading").innerText = "By Wash Report Update";
        break;
      case "Vendor_Invoices":
        document.getElementById("heading").innerText = "Vendor Invoices Update";
        break;
      case "Bids":
        document.getElementById("heading").innerText = "Bids Update";
        break;
      case "Vendors":
        document.getElementById("heading").innerText = "Vendors Update";
        break;
      case "Contracts":
        document.getElementById("heading").innerText = "Contracts Update";
        break;
      case "Deals":
        document.getElementById("heading").innerText = "SOW Update";
        break;
      case "Accounts":
        document.getElementById("heading").innerText = "Client/Sites Update";
        break;
      case "ServiceCompletions":
        document.getElementById("heading").innerText = "Service Completions Update";
        break;
    }
    document.getElementById("update-record").classList.remove("hidden");
    loadFields(module).then(() => {
      // Destroy old instance if exists
      if (choicesInstance) {
        choicesInstance.destroy();
      }
      // Apply searchable dropdown
      choicesInstance = new Choices("#fieldSelect", {
        searchEnabled: true,
        itemSelectText: "",
        shouldSort: false,
      });
    });
  }, 1000);

  document.getElementById(`fieldSelect`).addEventListener("change", async function () {
    const selectedField = this.options[this.selectedIndex];
    await updateValueInput(selectedField, module);
  });
});
ZOHO.embeddedApp.init();

async function loadContractFieldMetadata(moduleName) {
  try {
    const response = await ZOHO.CRM.META.getFields({ Entity: moduleName });
    if (!response || !response.fields) {
      throw new Error("No fields metadata received");
    }
    console.log(response.fields.api_name, "response.fields");
    return response.fields;
  } catch (error) {
    console.error("Error loading fields metadata:", error);
    showError("Failed to load fields metadata");
    throw error;
  }
}

async function loadFields(moduleName) {
  try {
    const fields = await loadContractFieldMetadata(moduleName);
    const fieldSelect = document.getElementById("fieldSelect");

    fieldSelect.innerHTML =
      '<option class="cursor-pointer" value="">Select field...</option>' +
      fields
        .map((field) => {
          // console.log(field, "field");
          // Normalize the data type for owner lookup fields
          const displayType = field.data_type === "ownerlookup" ? "userlookup" : field.data_type;

          //   if (displayType === "multiselectlookup") {
          //     console.log(`${field.field_label} (${displayType})`);
          //   }
          //   if (displayType === "lookup") {
          //     console.log(`${field.field_label} (${displayType})`);
          //   }

          return `<option class="cursor-pointer" value="${field.api_name}" 
                        data-type="${displayType}"
                        data-format="${field.format || ""}"
                        data-picklist='${
                          field.pick_list_values ? JSON.stringify(field.pick_list_values) : ""
                        }'
                        data-lookup-module="${field.lookup ? field.lookup.module : ""}"
                    >
                        ${field.field_label} (${displayType})
                    </option>`;
        })
        .join("");
  } catch (error) {
    console.error("Error loading fields:", error);
    showError("Failed to load fields");
  }
}

async function updateValueInput(selectedField, moduleName) {
  const container = document.getElementById("fieldValueContainer");
  const fieldType = selectedField.dataset.type;

  console.log("Updating value input for field type:", fieldType);

  // Reset selected file when field changes
  selectedFileForUpload = null;

  try {
    fieldLabel.innerText = "New Value";
    if (fieldType === "userlookup" || fieldType === "ownerlookup") {
      // Get all active users
      const usersResponse = await ZOHO.CRM.API.getAllUsers({
        Type: "ActiveUsers",
      });

      if (!usersResponse || !usersResponse.users) {
        throw new Error("Failed to load users list");
      }

      // Create a dropdown for users
      const inputHtml = `
                    <select class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" id="fieldValue" required>
                        <option class="cursor-pointer" value="">Select a user...</option>
                        ${usersResponse.users
                          .map(
                            (user) => `
                            <option class="cursor-pointer" value="${user.id}">
                                ${user.full_name} (${user.email})
                            </option>
                        `,
                          )
                          .join("")}
                    </select>
                `;
      container.innerHTML = inputHtml;
    } else if (fieldType === "multiselectlookup") {
      // Handle regular lookup fields with autocomplete
      container.innerHTML = `
                    <div class="lookup-container relative">
                        <input type="text" class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" id="fieldValueSearch" 
                              placeholder="Type at least 5 characters to search...">
                        <input type="hidden" id="fieldValue" required>
                        <div class="lookup-results" style="display: none; position: absolute; width: 100%; 
                            max-height: 200px; overflow-y: auto; z-index: 1000; background: white; 
                            border: 1px solid #ddd;"></div>
                    </div>
                `;
      setupMultipleLookupHandlers(selectedField, moduleName);
    } else if (fieldType === "lookup") {
      // Handle regular lookup fields with autocomplete
      container.innerHTML = `
                    <div class="lookup-container relative">
                        <input type="text" class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" id="fieldValueSearch" 
                              placeholder="Type at least 5 characters to search...">
                        <input type="hidden" id="fieldValue" required>
                        <div class="lookup-results" style="display: none; position: absolute; width: 100%; 
                            max-height: 200px; overflow-y: auto; z-index: 1000; background: white; 
                            border: 1px solid #ddd;"></div>
                    </div>
                `;

      const searchInput = document.getElementById("fieldValueSearch");
      setupLookupHandlers(selectedField, moduleName, searchInput);
    } else if (
      moduleName in MODULE_FILE_FIELD_MAPS &&
      selectedField.value in MODULE_FILE_FIELD_MAPS[moduleName]
    ) {
      fieldLabel.innerText = "Upload File";
      container.innerHTML = `
                  <div class="file-upload-container">
                    <input type="file" id="fileUpload" accept="*/*" 
                      class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition mb-2">
                    <div id="uploadStatus" class="text-sm text-gray-600 mb-2"></div>
                  </div>
                `;
      setupFileUploadHandler(selectedField.value);
    } else if (fieldType === "subform" && (moduleName === "Contracts" || moduleName === "Deals")) {
      fieldLabel.innerText = "Subform Value";
      container.innerHTML = `
            <p id="openModal" class="cursor-pointer bg-blue-700 text-center text-white px-4 py-2 rounded hover:bg-blue-800">SubForm Modal</p>`;
      subFormModal(selectedField, moduleName, container);
    } else {
      // Handle other field types as before
      switch (fieldType) {
        case "boolean":
          container.innerHTML = `<input type="checkbox" class="px-3.5 py-3 w-5 h-5 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" id="fieldValue">`;
          break;
        case "date":
          container.innerHTML = `<input type="date" class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" id="fieldValue" required>`;
          break;
        case "datetime":
          container.innerHTML = `<input type="datetime-local" class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" id="fieldValue" required>`;
          break;
        case "picklist":
          const picklistValues =
            selectedField.dataset.picklist ? JSON.parse(selectedField.dataset.picklist) : [];
          container.innerHTML = `
                            <select class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" id="fieldValue" required>
                                <option class="cursor-pointer" value="">Select an option...</option>
                                ${picklistValues
                                  .map(
                                    (item) =>
                                      `<option class="cursor-pointer" value="${item.display_value}">${item.display_value}</option>`,
                                  )
                                  .join("")}
                            </select>`;
          break;
        case "multiselectpicklist":
          const multiselectpicklist =
            selectedField.dataset.picklist ? JSON.parse(selectedField.dataset.picklist) : [];
          container.innerHTML = `
                            <select class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" id="fieldValue" multiple required>
                                ${multiselectpicklist
                                  .map(
                                    (item) =>
                                      `<option class="cursor-pointer" value="${item.actual_value}">${item.display_value}</option>`,
                                  )
                                  .join("")}
                            </select>`;
          break;
        case "fileupload":
          const fieldApiName = selectedField.value;
          const isMappedModuleFileField =
            moduleName in MODULE_FILE_FIELD_MAPS &&
            fieldApiName in MODULE_FILE_FIELD_MAPS[moduleName];
          if (fieldApiName.includes("Vendor_Specific_Attachments") || isMappedModuleFileField) {
            // Show file upload
            fieldLabel.innerText = "Upload File";
            container.innerHTML = `
                  <div class="file-upload-container">
                    <input type="file" id="fileUpload" accept="*/*" 
                      class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition mb-2">
                    <div id="uploadStatus" class="text-sm text-gray-600 mb-2"></div>
                  </div>
                `;
            setupFileUploadHandler(fieldApiName);
          } else {
            // Regular URL field
            container.innerHTML = `<input type="url" id="fieldValue" required
                    class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="https://example.com">`;
          }
          break;
        default:
          container.innerHTML = `<input type="text" id="fieldValue" required
                    class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">`;
      }
    }
  } catch (error) {
    console.error("Error updating value input:", error);
    showError("Failed to load field options");
    container.innerHTML = `<input type="text" class="w-full px-3.5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" id="fieldValue" required>`;
  }
}

// Function to upload file to WorkDrive
async function uploadFileToWorkDrive(file, moduleName) {
  return new Promise((resolve, reject) => {
    // Read file as base64
    const reader = new FileReader();
    reader.onload = async function (event) {
      try {
        const config = {
          CONTENT_TYPE: "multipart",
          PARTS: [
            {
              headers: { "Content-Disposition": "file;" },
              content: "__FILE__",
            },
          ],
          FILE: {
            fileParam: "content",
            file: file,
          },
        };

        const uploadFileData = await ZOHO.CRM.API.uploadFile(config);
        const fileId = uploadFileData?.data?.[0]?.details?.id;
        console.log(fileId, "fileId");
        if (!fileId) {
          reject(new Error("Failed to get file ID from CRM upload"));
          return;
        }

        const uploadReqData = {
          arguments: JSON.stringify({
            fileName: file.name,
            fileContent: fileId,
            contentType: file.type,
            fileSize: file.size,
            moduleName: moduleName || "",
          }),
        };

        console.log("fileName", file.name);
        console.log("fileContent", fileId);
        console.log("contentType", file.type);
        console.log("fileSize", file.size);

        // Call custom function to upload to WorkDrive
        let uploadResponse;
        try {
          uploadResponse = await ZOHO.CRM.FUNCTIONS.execute("uploadFileToWorkDrive", uploadReqData);
        } catch (funcError) {
          // If function doesn't exist, show helpful error
          if (funcError.message && funcError.message.includes("not found")) {
            reject(
              new Error(
                "Upload function not found. Please create 'uploadFileToWorkDrive' custom function in Zoho CRM.",
              ),
            );
            return;
          }
          reject(funcError);
          return;
        }

        if (uploadResponse?.details?.output) {
          const parsed = JSON.parse(uploadResponse.details.output);
          const result = parsed.results;

          if (result.success === true && result.url) {
            resolve(result.url);
          } else {
            reject(new Error(result.error || result.message || "Upload failed"));
          }
        } else {
          reject(new Error("Invalid response from upload function"));
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        reject(error);
      }
    };

    reader.onerror = function () {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

async function setupFileUploadHandler(fieldApiName) {
  const fileInput = document.getElementById("fileUpload");
  const uploadStatus = document.getElementById("uploadStatus");

  // Reset selected file when field changes
  selectedFileForUpload = null;

  fileInput.addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) {
      selectedFileForUpload = null;
      uploadStatus.innerHTML = "";
      return;
    }

    // Store file for later upload
    selectedFileForUpload = file;
    uploadStatus.innerHTML = `<span class="text-gray-600">📄 File selected: ${
      file.name
    } (${(file.size / 1024).toFixed(2)} KB)</span>`;
  });
}

function subFormModal(selectedField, moduleName, container) {
  addSubFormButton.style.display = "none";
  const openModal = document.getElementById("openModal");
  const modal = document.getElementById("modal");

  openModal.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
  (selectedField, moduleName, nameInput);
}

addRowButton.addEventListener("click", function () {
  if (!nameInput.value.trim()) {
    showError("Service Name is required!");
    return;
  }
  let nameTDs = document.querySelectorAll("#name-td");
  let existingRow = Array.from(nameTDs).find((td) => td.textContent === nameInput.value);
  console.log(existingRow);

  if (existingRow) {
    showError("Product already added!");
    return;
  }

  if (!table) {
    table = document.createElement("table");
    table.className = "w-full mt-4 border-collapse hidden";
    table.innerHTML = `
                        <thead class="bg-gray-200 sticky top-0 z-10 text-left">
                            <tr class="bg-gray-200">
                                <th class="p-2 border">Product Name</th>
                                <th class="p-2 border">Start Date</th>
                                <th class="p-2 border">End Date</th>
                                <th class="p-2 border">Client Price</th>
                                <th class="p-2 border">Vendor Price</th>
                                <th class="p-2 border">Action</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    `;
    tableBody = table.querySelector("tbody");
    tableContainer.appendChild(table);
  }

  let row = document.createElement("tr");
  row.className = "bg-white border transition-transform transform scale-95 opacity-0";
  row.innerHTML = `
                    <td id="name-td" class="p-2 border" data-product-id="${
                      nameInput.dataset.productId
                    }">${nameInput.value}</td>
                    <td class="p-2 border">${startDateInput.value || "N/A"}</td>
                    <td class="p-2 border">${endDateInput.value || "N/A"}</td>
                    <td class="p-2 border">${clientPriceInput.value || "N/A"}</td>
                    <td class="p-2 border">${vendorPriceInput.value || "N/A"}</td>
                    <td class="p-2 border text-center">
                        <p id="del" class="cursor-pointer text-red-500 font-bold">-</p>
                    </td>
                `;

  // Delete Row Function
  row.querySelector("#del").addEventListener("click", function () {
    row.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      row.remove();
      if (!tableBody.children.length) {
        table.classList.add("hidden");
        addSubFormButton.style.display = "none";
      }
    }, 300);
  });

  tableBody.appendChild(row);

  // Animate Table Appearance
  table.classList.remove("hidden");
  setTimeout(() => {
    row.classList.remove("scale-95", "opacity-0");
  }, 100);

  // Show "Add SubForm" Button
  addSubFormButton.style.display = "block";

  // Clear Inputs
  nameInput.value = "";
  startDateInput.value = "";
  endDateInput.value = "";
  clientPriceInput.value = "";
  vendorPriceInput.value = "";
});

function setupLookupHandlers(selectedField, moduleName, searchInput) {
  const hiddenInput = document.getElementById("fieldValue");
  const resultsDiv = document.querySelector(".lookup-results");

  let debounceTimeout;
  searchInput.addEventListener(
    "input",
    async function () {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(async () => {
        const searchTerm = this.value;
        if (searchTerm.length < 5) {
          resultsDiv.style.display = "none";
          return;
        }

        try {
          const fields = await loadContractFieldMetadata(moduleName);
          const field = fields.find((f) => f.api_name === selectedField.value);
          if (!field) {
            throw new Error("Field metadata not found");
          }

          const lookupData = await getLookupData(field, searchTerm);
          if (lookupData.length > 0) {
            resultsDiv.innerHTML = lookupData
              .map(
                (item) => `
                        <div class="lookup-item p-2 cursor-pointer hover:bg-gray-100" data-id="${item.id}" data-name="${item.name}">
                            ${item.name}
                        </div>
                    `,
              )
              .join("");
            resultsDiv.style.display = "block";

            // Add click handlers to results
            resultsDiv.querySelectorAll(".lookup-item").forEach((item) => {
              item.addEventListener("click", function () {
                const fieldSelectValue = document.getElementById(`fieldSelect`).value;
                // console.log("fieldValue", hiddenInput);
                if (fieldSelectValue == "Vendor") {
                  const selectedVendorId = this.dataset.id;
                  // console.log("vendor id", selectedVendorId)
                  ZOHO.CRM.API.getRecord({
                    Entity: "Vendors",
                    approved: "both",
                    RecordID: selectedVendorId,
                  }).then(function (data) {
                    const vendorRecord = data.data[0];
                    // console.log("vendor", vendorRecord)
                    if (vendorRecord.Status != "Active") {
                      showError("Vendor must be active to proceed.");
                      searchInput.value = "";
                      const func_name = "teamcliqnotification";
                      const req_data = {
                        arguments: JSON.stringify({
                          vendorId: selectedVendorId,
                          user: firstSelectedContractOpsUserEmail,
                        }),
                      };
                      ZOHO.CRM.FUNCTIONS.execute(func_name, req_data).then(function (data) {
                        console.log("team cliq func running", data);
                      });
                      return;
                    }
                  });
                }

                searchInput.dataset.productId = this.dataset.id;
                searchInput.value = this.dataset.name;
                hiddenInput.value = this.dataset.id;
                resultsDiv.style.display = "none";
              });
            });
          } else {
            resultsDiv.innerHTML = '<div class="p-2">No results found</div>';
            resultsDiv.style.display = "block";
          }
        } catch (error) {
          console.error("Error in lookup search:", error);
          resultsDiv.innerHTML = '<div class="p-2 text-danger">Error loading results</div>';
          resultsDiv.style.display = "block";
        }
      });

      // Close results when clicking outside
      document.addEventListener("click", function (e) {
        if (!resultsDiv.contains(e.target) && e.target !== searchInput) {
          resultsDiv.style.display = "none";
        }
      });
    },
    300,
  );
}

async function getLookupData(field, searchTerm) {
  try {
    const moduleMapping = {
      Locations: {
        module: "Accounts",
        searchField: "Account_Name",
      },
      Our_Services: {
        module: "Products",
        searchField: "Product_Name",
      },
      Our_Services_SubForm: {
        module: "Products",
        searchField: "Product_Name",
      },
      Scope_of_Work: {
        module: "Products",
        searchField: "Product_Name",
      },
      Fleet_Units: {
        module: "Fleet_Units",
        searchField: "Name",
      },
      Parent_Account: {
        module: "Accounts",
        searchField: "Account_Name",
      },
      SOW_Name: {
        module: "Deals",
        searchField: "Deal_Name",
      },
      Deal: {
        module: "Deals",
        searchField: "Deal_Name",
      },
      Vendor_Invoice: {
        module: "Vendor_Invoices",
        searchField: "Name",
      },
      Company_Name_New: {
        module: "Accounts",
        searchField: "Account_Name",
      },
      ServiceCompletion: {
        module: "ServiceCompletions",
        searchField: "Name",
      },
      Unit: {
        module: "Fleet_Units",
        searchField: "Name",
      },
      Service_Completion: {
        module: "ServiceCompletions",
        searchField: "Name",
      },
      Company_Name: {
        module: "Accounts",
        searchField: "Account_Name",
      },
      Company: {
        module: "Accounts",
        searchField: "Account_Name",
      },
      Client_Company_Name: {
        module: "Accounts",
        searchField: "Account_Name",
      },
      Site: {
        module: "Accounts",
        searchField: "Account_Name",
      },
      Site_Name: {
        module: "Accounts",
        searchField: "Account_Name",
      },
      Client: {
        module: "Accounts",
        searchField: "Account_Name",
      },
      Site_Number: {
        module: "Accounts",
        searchField: "Account_Name",
      },
      Account_Name: {
        module: "Accounts",
        searchField: "Account_Name",
      },
      Vendor_Contract: {
        module: "Contracts",
        searchField: "Name",
      },
      Contracts: {
        module: "Contracts",
        searchField: "Name",
      },
      Contract: {
        module: "Contracts",
        searchField: "Name",
      },
      Client_Contract: {
        module: "Contracts",
        searchField: "Name",
      },
      Vendor: {
        module: "Vendors",
        searchField: "Vendor_Name",
      },
      Vendor_Name: {
        module: "Vendors",
        searchField: "Vendor_Name",
      },
      Region_Distric_Zone: {
        module: "Contacts",
        searchField: "Full_Name",
      },
    };

    const mapping = moduleMapping[field.api_name];
    console.log(mapping, "mapping");
    if (!mapping) {
      console.error("Unknown lookup field:", field.api_name);
      return [];
    }

    if (field.data_type === "ownerlookup" || mapping.module === "users") {
      const response = await ZOHO.CRM.API.getAllUsers({
        Type: "ActiveUsers",
      });
      return response.users.map((user) => ({
        id: user.id,
        name: `${user.full_name} (${user.email})`,
      }));
    }

    const response = await ZOHO.CRM.API.searchRecord({
      Entity: mapping.module,
      Type: "word",
      Query: searchTerm,
    });

    return (
      response.data?.map((record) => ({
        id: record.id,
        name: record[mapping.searchField],
      })) || []
    );
  } catch (error) {
    console.error("Error in getLookupData:", error);
    return [];
  }
}

function setupMultipleLookupHandlers(selectedField, moduleName) {
  const searchInput = document.getElementById("fieldValueSearch");
  const hiddenInput = document.getElementById("fieldValue");
  const resultsDiv = document.querySelector(".lookup-results");

  // Container for selected items
  const selectedContainer = document.createElement("div");
  selectedContainer.className = "selected-items flex flex-wrap gap-2 mt-2";
  searchInput.parentNode.insertBefore(selectedContainer, searchInput.nextSibling);

  let selectedItems = [];

  let debounceTimeout;
  searchInput.addEventListener("input", function () {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      const searchTerm = this.value;
      if (searchTerm.length < 5) {
        resultsDiv.style.display = "none";
        return;
      }

      try {
        const fields = await loadContractFieldMetadata(moduleName);
        const field = fields.find((f) => f.api_name === selectedField.value);
        if (!field) {
          throw new Error("Field metadata not found");
        }

        const lookupData = await getLookupData(field, searchTerm);
        console.log(lookupData, "lookupData");
        if (lookupData.length > 0) {
          resultsDiv.innerHTML = lookupData
            .map(
              (item) => `
                          <div class="lookup-item cursor-pointer hover:bg-gray-200" data-id="${item.id}" data-name="${item.name}">
                              ${item.name}
                          </div>
                      `,
            )
            .join("");
          resultsDiv.style.display = "block";

          // Add click handlers to results
          resultsDiv.querySelectorAll(".lookup-item").forEach((item) => {
            item.addEventListener("click", function () {
              const itemId = this.dataset.id;
              const itemName = this.dataset.name;
              console.log(itemId, itemName, "itemId, itemName");

              // Prevent duplicate selections
              if (!selectedItems.some((el) => el.id === itemId)) {
                selectedItems.push({ id: itemId, name: itemName });
                console.log(selectedItems, "selectedItems");
                updateSelectedItems();
              }

              searchInput.value = "";
              resultsDiv.style.display = "none";
            });
          });
        } else {
          resultsDiv.innerHTML = '<div class="p-2">No results found</div>';
          resultsDiv.style.display = "block";
        }
      } catch (error) {
        console.error("Error in lookup search:", error);
        resultsDiv.innerHTML = '<div class="p-2 text-danger">Error loading results</div>';
        resultsDiv.style.display = "block";
      }
    }, 300);
  });

  function updateSelectedItems() {
    selectedContainer.innerHTML = selectedItems
      .map(
        (item) => `
              <div class="bg-indigo-500 text-white px-3 py-1 rounded-lg flex items-center">
                ${item.name} 
                <span class="ml-2 cursor-pointer remove-item" data-id="${item.id}">✕</span>
              </div>
            `,
      )
      .join("");

    hiddenInput.value = JSON.stringify(selectedItems.map((item) => item.id));

    // Add remove handlers
    selectedContainer.querySelectorAll(".remove-item").forEach((removeBtn) => {
      removeBtn.addEventListener("click", function () {
        const removeId = this.dataset.id;
        selectedItems = selectedItems.filter((el) => el.id !== removeId);
        updateSelectedItems();
      });
    });
  }

  // Close results when clicking outside
  document.addEventListener("click", function (e) {
    if (!resultsDiv.contains(e.target) && e.target !== searchInput) {
      resultsDiv.style.display = "none";
    }
  });
}

// Helper functions
function createLoadingSpinner() {
  const loadingIndicator = document.createElement("div");
  loadingIndicator.classList.add("flex", "items-center", "justify-center", "h-full");

  const spinner = document.createElement("div");
  spinner.classList.add(
    "animate-spin",
    "rounded-full",
    "h-16",
    "w-16",
    "border-t-4",
    "border-blue-500",
  );

  loadingIndicator.appendChild(spinner);
  return loadingIndicator;
}

function showSuccess(message) {
  const notification = document.createElement("div");
  notification.className = "notification notification-success";
  notification.textContent = message;
  document.body.appendChild(notification);
  notification.classList.add("show");

  setTimeout(() => {
    notification.classList.remove("show");
    notification.remove();
  }, 3000);
}

function showError(message) {
  const notification = document.createElement("div");
  notification.className = "notification notification-error";
  notification.textContent = message;
  document.body.appendChild(notification);
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
    notification.remove();
  }, 3000);
}
