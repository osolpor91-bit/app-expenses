import type { Locale } from "./config";

export const dictionaries = {
  es: {
    common: {
      appName: "Osolpor",
      loading: "Cargando...",
      saving: "Guardando...",
      deleting: "Eliminando...",
      active: "Activo",
      yes: "Sí",
      no: "No",
      open: "Abrir",
      back: "Volver",
      cancel: "Cancelar",
      save: "Guardar",
      edit: "Editar",
      delete: "Eliminar",
      new: "Nuevo",
      actions: "Acciones",
      noActionsAvailable: "No hay acciones disponibles",
      settings: "Ajustes",
      logout: "Cerrar sesión",
      loggingOut: "Cerrando sesión...",
      changeLanguage: "Cambiar idioma",
      currentLanguage: "Idioma actual",
      tenantActive: "Tenant activo",
      role: "Rol",
      fieldRequired: "{field} es obligatorio.",
      search: "Buscar",
      searchPlaceholder: "Buscar...",
      clearSearch: "Limpiar búsqueda",
      applyFilters: "Aplicar filtros",
      clearFilters: "Limpiar filtros",
      all: "Todos",
      filters: "Filtros",
      hideFilters: "Ocultar filtros",
      invalidDateRange:
        "Formato de fecha no válido. Usa 01/01/2026..31/01/2026.",
      activeCompany: "Empresa activa",
      changeCompany: "Cambiar empresa",
      currentCompany: "Empresa actual",
      noActiveCompany: "No hay empresa activa",
      noCompaniesAvailable: "No hay empresas disponibles",
      autoCreateHint: "Completa los campos obligatorios para crear el registro automáticamente.",

      currency: "Divisa",
      currencyEur: "EUR",
      currencyUsd: "USD",
      currencyGbp: "GBP",

      documentType: "Tipo",
      documentTypeInvoice: "Factura",
      documentTypeCreditNote: "Abono",

      validations: {
        invalidIban: "El IBAN informado no es válido.",
        invalidEmailList:
          "El email informado no es válido. Si indicas varios emails, sepáralos con punto y coma (;).",
        invalidPercentage:
          "El porcentaje debe ser un número entre 0 y 100, con un máximo de 2 decimales.",
        invalidDecimal:
          "El número debe ser válido, con un máximo de 2 decimales.",
        invalidContainsDot: "El campo debe contener al menos un punto.",
        invalidDigitsOnly: "El campo solo puede contener números.",
        invalidCountryCode: "El código de país debe tener 2 letras.",
        invalidValue: "El valor informado no es válido.",
        invalidOption: "El valor seleccionado no es válido.",
        invalidEmail: "El email informado no es válido.",
        invalidSmtpPort: "El puerto SMTP debe ser un número entre 1 y 65535.",
      },
    },

    nav: {
      menu: "Menú",
      configurations: "Configuraciones",
      treasury: "Tesorería",
      companies: "Empresas",
      suppliers: "Proveedores",
      countries: "Países",
    },

    configurations: {
      title: "Configuraciones",

      groups: {
        general: {
          title: "Generales",
        },
        purchasing: {
          title: "Compras",
        },
      },
    },

    list: {
      editList: "Editar lista",
      viewList: "Ver lista",
    },

    dashboard: {
      mainMenu: "Menú principal",
      indicators: "Indicadores y accesos rápidos",
      quickAction: "Acción rápida",
      newSupplier: "Nuevo proveedor",
      treasury: "Tesorería",
      registerExpense: "Registrar gasto",
      totalBalance: "Balance total",
    },

    companies: {
      title: "Empresas",
      name: "Nombre",
      taxId: "CIF/NIF",
      websiteUrl: "Página web",
      phone: "Teléfono",
      address: "Dirección",
      city: "Población",
      province: "Provincia",
      postalCode: "C.P.",
      country: "País",
      emptyList: "No hay empresas creadas todavía.",
      errorReading: "Error leyendo empresas",
      errorRefreshing: "Error actualizando empresas",
      backToCompanies: "Volver a empresas",
      editTitle: "Editar empresas",
      editDescription:
        "Edita una celda y sal de ella para guardar automáticamente.",

      sectionGeneral: "General",
      sectionAddress: "Dirección",
      sectionDocumentSettings: "Configuración documental",
      sectionSupplierPortal: "Portal proveedores",

      supplierPortalEnabled: "Portal proveedores activo",
      supplierUploadCode: "Código público de subida",
      attachmentStorageProvider: "Guardar adjuntos en",
      storageProviderSupabaseStorage: "Supabase Storage",
      storageProviderSharePoint: "SharePoint",
      supplierPortalLanguage: "Idioma del portal",
      supplierPortalLanguageEs: "Español",
      supplierPortalLanguageEn: "Inglés",

      sectionPurchases: "Compras",
      purchaseDefaultLineType: "Tipo por defecto",
      purchaseLineTypeItem: "Artículo",
      purchaseLineTypeAccount: "Cuenta",

      grid: {
        deleteSelected: "Eliminar seleccionadas",
        selectedSuffix: "seleccionada(s)",
        helpText:
          "La última fila sirve para crear una empresa nueva. Informa Nombre, CIF/NIF y País para crearla automáticamente. Para eliminar, selecciona una o varias filas y pulsa Eliminar seleccionadas.",
        createRequiredFields:
          "Para crear una empresa nueva informa Nombre, CIF/NIF y País.",
        requiredFields: "Nombre y CIF/NIF son obligatorios.",
        invalidCountry: "País no válido.",
        saveError: "Error al guardar",
        createError: "Error al crear empresa",
        deleteError: "Error al eliminar empresas",
        companyCreated: "Empresa creada correctamente.",
        changeSaved: "Cambio guardado correctamente.",
        selectAtLeastOneToDelete:
          "Selecciona al menos una empresa para eliminar.",
        confirmDelete: "¿Seguro que quieres eliminar {count} empresa(s)?",
        noRowsDeleted:
          "No se ha eliminado ninguna empresa. Revisa la policy DELETE de RLS en Supabase.",
        companiesDeleted: "Empresas eliminadas correctamente.",
      },
    },

    countries: {
      title: "Países",
      code: "Código",
      name: "Nombre",
      isEu: "País UE",
      yes: "Sí",
      no: "No",
      emptyList: "No hay países creados todavía.",
      errorReading: "Error leyendo países",
      errorRefreshing: "Error actualizando países",

      fillEuCountries: "Rellenar países UE (IA)",
      fillingEuCountries: "Rellenando...",

      grid: {
        deleteSelected: "Eliminar seleccionados",
        selectedSuffix: "seleccionado(s)",
        helpText:
          "La última fila sirve para crear un país nuevo. Informa Código y Nombre. En País UE puedes indicar Sí o No. Para eliminar, selecciona una o varias filas y pulsa Eliminar seleccionados.",
        createRequiredFields: "Para crear un país informa Código y Nombre.",
        requiredFields: "Código y Nombre son obligatorios.",
        invalidCountryCode:
          "El código del país debe tener 2 letras. Ejemplo: ES.",
        saveError: "Error al guardar",
        createError: "Error al crear país",
        deleteError: "Error al eliminar países",
        countryCreated: "País creado correctamente.",
        changeSaved: "Cambio guardado correctamente.",
        selectAtLeastOneToDelete: "Selecciona al menos un país para eliminar.",
        confirmDelete: "¿Seguro que quieres eliminar {count} país(es)?",
        noRowsDeleted:
          "No se ha eliminado ningún país. Revisa la policy DELETE de RLS en Supabase.",
        countriesDeleted: "Países eliminados correctamente.",
      },

      ai: {
        missingApiKey: "Falta la variable de entorno GEMINI_API_KEY.",
        geminiCallError: "Error llamando a Gemini",
        geminiNoContent: "Gemini no devolvió contenido interpretable.",
        geminiInvalidCountries:
          "Gemini no devolvió una lista de países válida.",
        noPermission: "No tienes permisos para actualizar países.",
        noValidCountries: "Gemini no devolvió países UE válidos.",
        updateError: "Error actualizando países",
        success: "Países UE actualizados correctamente: {count}.",
        unexpected: "Error inesperado rellenando países UE.",
      },
    },

    treasuryGeneral: {
      title: "Tesorería general",

      treasuryType: "Tipo",
      balance: "Saldo",

      treasuryTypeRealIncome: "Ingresos Reales",
      treasuryTypeExpectedIncome: "Ingresos Previstos",
      treasuryTypeRealExpense: "Gastos Reales",
      treasuryTypeExpectedExpense: "Gastos Previstos",

      treasuryMovementAction: "Añadir movimiento",
      treasuryMovementsAction: "Ver movimientos",
      treasuryBalanceAction: "Balance total",
      treasuryMovementTitle: "Nuevo movimiento de tesorería",
      treasuryMovementType: "Tipo",
      treasuryMovementAmount: "Importe",
      treasuryMovementDate: "Fecha",
      treasuryMovementAccount: "Cuenta contable",
      treasuryMovementAccountPlaceholder: "Buscar cuenta por descripción",
      treasuryMovementSelectTypeFirst: "Selecciona primero el tipo",
      treasuryMovementAccountRequired: "La cuenta contable es obligatoria.",
      treasuryMovementAccountTypeMismatch:
        "La cuenta contable no corresponde al tipo de movimiento.",
      treasuryMovementNoAccounts:
        "No hay cuentas contables disponibles para movimientos.",
      treasuryMovementNoExpenseAccounts:
        "No hay cuentas disponibles del grupo 6: Gastos.",
      treasuryMovementNoIncomeAccounts:
        "No hay cuentas disponibles del grupo 7: Ingresos.",
      treasuryMovementPaidBy: "Pagado por",
      treasuryMovementPaidByPlaceholder:
        "Buscar miembro por nombre o apellidos",
      treasuryMovementPaidByRequired:
        "El miembro que ha pagado es obligatorio.",
      treasuryMovementNoMembers:
        "No hay miembros disponibles. Crea al menos uno en Configuraciones.",
      treasuryMovementComment: "Comentario",
      treasuryMovementCommentPlaceholder: "Comentario opcional",
      treasuryMovementSaving: "Guardando...",
      treasuryMovementError: "Error al crear el movimiento",
      accept: "Aceptar",
      close: "Cerrar",

      emptyList: "No hay registros de tesorería general.",
      errorReading: "Error leyendo tesorería general",
      noActiveCompanyDescription:
        "No hay una empresa activa. Selecciona una empresa para consultar tesorería general.",
    },

    treasuryBalance: {
      title: "Balance de tesorería",
      backToTreasuryGeneral: "Volver a tesorería general",
      helpText:
        "Balance Susarros.",
      date: "Fecha",
      accountNo: "Cuenta",
      accountDescription: "Descripción",
      incomeGroup: "Ingresos",
      expenseGroup: "Gastos",
      realShort: "Reales",
      expectedShort: "Previstos",
      differenceShort: "Diferencia",
      realIncome: "Ingresos reales",
      expectedIncome: "Ingresos previstos",
      realExpense: "Gastos reales",
      expectedExpense: "Gastos previstos",
      expenseDifference: "Diferencia gastos",
      balance: "Balance",
      total: "Total general",
      totalBalance: "Balance total",
      emptyList: "No hay movimientos para el periodo seleccionado.",
      errorReading: "Error leyendo el balance de tesorería",
      noActiveCompanyDescription:
        "No hay una empresa activa. Selecciona una empresa para consultar el balance.",
    },

    treasuryGeneralMovements: {
      title: "Movimientos de tesorería",
      backToTreasuryGeneral: "Volver a tesorería general",
      movementDate: "Fecha",
      treasuryType: "Tipo",
      accountDescription: "Cuenta contable",
      paidBy: "Pagado por",
      amount: "Importe",
      comment: "Comentario",
      treasuryTypeRealIncome: "Ingresos Reales",
      treasuryTypeExpectedIncome: "Ingresos Previstos",
      treasuryTypeRealExpense: "Gastos Reales",
      treasuryTypeExpectedExpense: "Gastos Previstos",
      treasuryMovementEditAction: "Modificar datos",
      treasuryMovementEditTitle: "Modificar movimiento de tesorería",
      treasuryMovementType: "Tipo",
      treasuryMovementAmount: "Importe",
      treasuryMovementDate: "Fecha",
      treasuryMovementAccount: "Cuenta contable",
      treasuryMovementAccountPlaceholder: "Buscar cuenta por descripción",
      treasuryMovementSelectTypeFirst: "Selecciona primero el tipo",
      treasuryMovementAccountRequired: "La cuenta contable es obligatoria.",
      treasuryMovementAccountTypeMismatch:
        "La cuenta contable no corresponde al tipo de movimiento.",
      treasuryMovementNoAccounts:
        "No hay cuentas contables disponibles para movimientos.",
      treasuryMovementNoExpenseAccounts:
        "No hay cuentas disponibles del grupo 6: Gastos.",
      treasuryMovementNoIncomeAccounts:
        "No hay cuentas disponibles del grupo 7: Ingresos.",
      treasuryMovementPaidBy: "Pagado por",
      treasuryMovementPaidByPlaceholder:
        "Buscar miembro por nombre o apellidos",
      treasuryMovementPaidByRequired:
        "El miembro que ha pagado es obligatorio.",
      treasuryMovementNoMembers:
        "No hay miembros disponibles. Crea al menos uno en Configuraciones.",
      treasuryMovementComment: "Comentario",
      treasuryMovementCommentPlaceholder: "Comentario opcional",
      treasuryMovementUpdate: "Modificar",
      treasuryMovementUpdating: "Modificando...",
      treasuryMovementUpdateError: "Error al modificar el movimiento",
      close: "Cerrar",
      emptyList: "No hay movimientos de tesorería.",
      listHelpText:
        "Consulta los movimientos registrados y utiliza los filtros para localizar ingresos o gastos.",
      errorReading: "Error leyendo movimientos de tesorería",
      noActiveCompanyDescription:
        "No hay una empresa activa. Selecciona una empresa para consultar los movimientos.",
      selectRecordToDelete: "Selecciona un movimiento para eliminar.",
      confirmDelete:
        "¿Seguro que quieres eliminar el movimiento de \"{name}\"?",
      deleteError: "Error al eliminar el movimiento",
      noRowsDeleted: "No se ha eliminado ningún movimiento.",
      recordDeleted: "Movimiento eliminado correctamente.",
    },

    treasuryMembers: {
      title: "Miembros",
      firstName: "Nombre",
      lastName: "Apellidos",
      isDefault: "Predeterminado",
      isGuest: "Invitado",
      emptyList: "No hay miembros creados.",
      errorReading: "Error leyendo miembros",
      errorRefreshing: "Error actualizando miembros",
      noActiveCompanyDescription:
        "No hay una empresa activa. Selecciona una empresa para gestionar miembros.",
      grid: {
        deleteSelected: "Eliminar seleccionados",
        selectedSuffix: "seleccionado(s)",
        helpText:
          "Edita los miembros directamente en la lista. Solo puede haber un miembro predeterminado.",
        createRequiredFields:
          "Para crear un miembro informa Nombre y Apellidos.",
        requiredFields: "Nombre y Apellidos son obligatorios.",
        saveError: "Error al guardar el miembro",
        createError: "Error al crear el miembro",
        deleteError: "Error al eliminar miembros",
        recordCreated: "Miembro creado correctamente.",
        changeSaved: "Miembro actualizado correctamente.",
        selectAtLeastOneToDelete:
          "Selecciona al menos un miembro para eliminar.",
        confirmDelete: "¿Seguro que quieres eliminar {count} miembro(s)?",
        noRowsDeleted: "No se ha eliminado ningún miembro.",
        recordsDeleted: "Miembros eliminados correctamente.",
      },
    },

    items: {
      title: "Artículos",
      createTitle: "Nuevo artículo",
      editTitle: "Artículo",
      backToList: "Volver a artículos",
      editSubtitle: "Artículo · {description}",

      code: "Código",
      description: "Descripción",
      itemType: "Tipo artículo",
      itemTypeProduct: "Producto",
      itemTypeService: "Servicio",
      itemTypeExpense: "Gasto",
      itemTypeOther: "Otro",
      category: "Categoría",
      baseUnitOfMeasure: "Unidad medida base",
      unitUnd: "UND",
      unitKg: "KG",
      unitG: "G",
      unitL: "L",
      unitM: "M",
      unitH: "H",
      unitBox: "Caja",
      unitPack: "Paquete",
      barcode: "Código de barras",
      preferredSupplier: "Proveedor preferente",
      purchasePrice: "Precio compra",
      salesPrice: "Precio venta",
      unitCost: "Coste unitario",
      isActive: "Activo",
      fiscalTreatment: "Tratamiento fiscal",
      inventory: "Inventario (base)",

      sectionGeneral: "General",
      sectionPurchaseSales: "Compras y ventas",

      emptyList: "No hay artículos creados todavía.",
      listHelpText:
        "Selecciona un artículo y pulsa Editar. También puedes hacer doble clic sobre una línea para abrir la ficha.",
      errorReading: "Error leyendo artículos",
      noActiveCompanyDescription:
        "No hay una empresa activa. Selecciona una empresa para trabajar con artículos.",

      createError: "Error al crear artículo",
      saveError: "Error al guardar artículo",
      noRecordId: "No se ha podido identificar el artículo.",
      recordSaved: "Artículo guardado correctamente.",

      selectRecordToDelete: "Selecciona un artículo para eliminar.",
      confirmDelete: "¿Seguro que quieres eliminar el artículo \"{name}\"?",
      deleteError: "Error al eliminar artículo",
      noRowsDeleted:
        "No se ha eliminado ningún artículo. Revisa la policy DELETE de RLS en Supabase.",
      recordDeleted: "Artículo eliminado correctamente.",

      factBoxTitle: "Datos principales",
      comingSoonTitle: "Próximamente",
      comingSoonText:
        "Aquí podremos mostrar stock, movimientos, precios, trazabilidad o actividad reciente.",

      balanceAction: "Saldo",
      inventoryAdjustmentAction: "Ajuste inventario",
      inventoryAdjustmentTitle: "Ajuste inventario",
      selectedItem: "Artículo",
      selectedItemDescription: "Descripción",
      postingDate: "Fecha de registro",
      adjustmentEntryType: "Tipo",
      adjustmentEntryTypeIn: "Entrada",
      adjustmentEntryTypeOut: "Salida",
      documentNo: "Nº documento",
      quantity: "Cantidad",
      unitOfMeasure: "Unidad de medida",
      accept: "Aceptar",
      adjusting: "Ajustando...",
      close: "Cerrar",
      adjustmentCreated: "Ajuste de inventario creado correctamente.",
      adjustmentError: "Error al crear ajuste",
    },

    itemBalanceEntries: {
      title: "Saldo artículos",
      createTitle: "Nuevo movimiento de saldo",
      editTitle: "Movimiento de saldo",
      backToList: "Volver a saldo artículos",
      editSubtitle: "Saldo · {itemDescription}",

      postingDate: "Fecha de registro",
      documentNo: "Nº documento",
      origin: "Origen",
      originPurchase: "Compra",
      originSale: "Venta",
      originAdjustment: "Ajuste",
      unitOfMeasure: "Unidad de medida",

      item: "Artículo",
      itemCode: "Código artículo",
      itemDescription: "Descripción artículo",
      entryType: "Tipo",
      entryTypeIn: "Entrada",
      entryTypeOut: "Salida",
      quantity: "Cantidad",
      createdAt: "Fecha",

      emptyList: "No hay movimientos de saldo para este artículo.",
      listHelpText:
        "Listado de movimientos de saldo del artículo seleccionado. Esta página es solo de consulta.",
      errorReading: "Error leyendo saldo de artículos",
      noActiveCompanyDescription:
        "No hay una empresa activa. Selecciona una empresa para consultar saldo de artículos.",

      createError: "No se pueden crear movimientos desde esta página.",
      saveError: "No se pueden modificar movimientos desde esta página.",
      noRecordId: "No se ha podido identificar el movimiento.",
      recordSaved: "Movimiento guardado correctamente.",

      selectRecordToDelete: "Selecciona un movimiento para eliminar.",
      confirmDelete: "¿Seguro que quieres eliminar el movimiento \"{name}\"?",
      deleteError: "Error al eliminar movimiento",
      noRowsDeleted:
        "No se ha eliminado ningún movimiento. Revisa la policy DELETE de RLS en Supabase.",
      recordDeleted: "Movimiento eliminado correctamente.",

      factBoxTitle: "Datos principales",
      comingSoonTitle: "Próximamente",
      comingSoonText:
        "Aquí podremos mostrar detalle del movimiento o trazabilidad.",
    },

    suppliers: {
      title: "Proveedores",
      summaryTitle: "Resumen proveedores",
      createTitle: "Nuevo proveedor",
      suppliers: "Proveedores",
      usedCountries: "Países usados",
      lastSupplier: "Último proveedor",
      noLastSupplier: "Todavía no hay proveedores.",
      quickHelp: "Ayuda rápida",
      quickHelpText:
        "Selecciona un proveedor de la lista y pulsa Editar para abrir su ficha. También puedes pulsar directamente sobre el nombre o hacer doble clic en la línea.",
      noEmail: "Sin email",
      errorReading: "Error leyendo proveedores",

      name: "Nombre",
      commercialName: "Nombre comercial",
      taxId: "CIF/NIF",
      code: "Código",
      withholdingRate: "% Retención",
      preferredIban: "IBAN preferido",
      email: "Email",
      websiteUrl: "Página web",
      phone: "Teléfono",
      address: "Dirección",
      city: "Población",
      province: "Provincia",
      postalCode: "C.P.",
      country: "País",
      paymentChannel: "Canal de pago",
      taxArea: "Área impuesto",
      portalDefaultLineType: "Tipo por defecto portal",
      portalDefaultLineNo: "Nº por defecto portal",
      pricesIncludeVat: "Precios IVA incluido",
      purchaseLineTypeItem: "Artículo",
      purchaseLineTypeAccount: "Cuenta",
      tenant: "Tenant",

      emptyList: "No hay proveedores creados todavía.",
      listHelpText:
        "Selecciona una línea y pulsa Editar. También puedes hacer doble clic sobre una línea para abrir la ficha. Eliminar borra únicamente el proveedor seleccionado.",

      backToSuppliers: "Volver a proveedores",
      newTitle: "Nuevo proveedor",
      editSubtitle: "Ficha de proveedor · {taxId}",

      selectCountry: "Selecciona país",
      save: "Guardar",
      saving: "Guardando...",
      cancel: "Cancelar",

      nameRequired: "El nombre es obligatorio.",
      taxIdRequired: "El CIF/NIF es obligatorio.",
      countryRequired: "El país es obligatorio.",
      createError: "Error al crear proveedor",
      saveError: "Error al guardar proveedor",
      noSupplierId: "No se ha podido identificar el proveedor.",
      supplierSaved: "Proveedor guardado correctamente.",

      selectSupplierToDelete: "Selecciona un proveedor para eliminar.",
      confirmDelete: "¿Seguro que quieres eliminar el proveedor \"{name}\"?",
      deleteError: "Error al eliminar proveedor",
      noRowsDeleted:
        "No se ha eliminado ningún proveedor. Revisa la policy DELETE de RLS en Supabase.",
      supplierDeleted: "Proveedor eliminado correctamente.",

      factBoxTitle: "Datos principales",
      locationTitle: "Ubicación",
      noAddress: "Sin dirección",
      noLocation: "Sin población",
      comingSoonTitle: "Próximamente",
      comingSoonText:
        "Aquí podremos mostrar documentos, contactos, facturas recibidas, mensajes del portal o actividad reciente del proveedor.",

      newFactBoxTitle: "Alta de proveedor",
      requiredFieldsHelp: "Los campos obligatorios son Nombre, CIF/NIF y País.",
      countriesAvailableTitle: "Países disponibles",
      company: "Empresa",
      newDescription: "Crea una ficha de proveedor para la empresa activa.",
      noActiveCompanyDescription:
        "No hay una empresa activa. Crea o selecciona una empresa para poder trabajar con proveedores.",
      countriesAvailableText:
        "El país se selecciona desde el maestro de países configurado para el tenant activo.",

      sectionGeneral: "General",
      sectionAddressAndContact: "Dirección y contacto",
      sectionSupplierPortal: "Portal proveedor",
    },

    portalSupplierInvoices: {
      title: "Documentos portal proveedor",
      createTitle: "Nueva factura portal proveedor",
      editTitle: "Factura portal proveedor",
      backToList: "Volver a facturas portal proveedor",
      editSubtitle: "Factura · {invoiceNo}",

      invoiceNo: "Nº documento",
      supplierNo: "Nº proveedor",
      country: "País",
      paymentChannel: "Canal pago",
      taxArea: "Área impuesto",
      postingDate: "Fecha registro",
      invoiceDate: "Fecha factura",
      exchangeRate: "Tipo cambio",
      totalBaseAmount: "Importe Base",
      totalVatAmount: "Importe IVA",
      totalAmount: "Importe Total",
      status: "Estado",
      hasAttachments: "Adjuntos",

      sectionGeneral: "General",
      totalsSectionTitle: "Totales",

      emptyList: "No hay facturas de portal proveedor.",
      listHelpText:
        "Selecciona una factura y pulsa Editar. También puedes hacer doble clic sobre una línea para abrir la ficha.",
      errorReading: "Error leyendo facturas de portal proveedor",
      noActiveCompanyDescription:
        "No hay una empresa activa. Selecciona una empresa para trabajar con facturas del portal.",

      createError: "Error al crear factura",
      saveError: "Error al guardar factura",
      noRecordId: "No se ha podido identificar la factura.",
      recordSaved: "Factura guardada correctamente.",

      selectRecordToDelete: "Selecciona una factura para eliminar.",
      confirmDelete: "¿Seguro que quieres eliminar la factura \"{name}\"?",
      deleteError: "Error al eliminar factura",
      noRowsDeleted:
        "No se ha eliminado ninguna factura. Revisa la policy DELETE de RLS en Supabase.",
      recordDeleted: "Factura eliminada correctamente.",

      factBoxTitle: "Datos principales",
      comingSoonTitle: "Próximamente",
      comingSoonText:
        "Aquí podremos mostrar el documento recibido, trazabilidad del portal, aprobaciones o actividad reciente.",

      sourceType: "Origen",
      sourceTypeBlank: "",
      sourceTypeEmail: "Correo",
      sourceTypePortal: "Portal proveedor",
      sourceTypeApi: "API externa",
      sourceTypeManual: "Carga manual",
    },

    purchaseInvoices: {
      title: "Documentos de compra",
      createTitle: "Nueva factura de compra",
      editTitle: "Documento de compra",
      backToList: "Volver a documentos de compra",
      editSubtitle: "documentos · {invoiceNo}",

      invoiceNo: "Nº documento",
      supplierNo: "Nº proveedor",
      country: "País",
      paymentChannel: "Canal pago",
      taxArea: "Área impuesto",
      postingDate: "Fecha registro",
      invoiceDate: "Fecha factura",
      exchangeRate: "Tipo cambio",
      totalBaseAmount: "Importe Base",
      totalVatAmount: "Importe IVA",
      totalAmount: "Importe Total",
      status: "Estado",
      hasAttachments: "Adjuntos",

      sectionGeneral: "General",
      totalsSectionTitle: "Totales",

      emptyList: "No hay documentos de compra.",
      listHelpText:
        "Selecciona una documentos y pulsa Editar. También puedes hacer doble clic sobre una línea para abrir la ficha.",
      errorReading: "Error leyendo documentos de compra",
      noActiveCompanyDescription:
        "No hay una empresa activa. Selecciona una empresa para trabajar con documentos de compra.",

      createError: "Error al crear documentos",
      saveError: "Error al guardar documentos",
      noRecordId: "No se ha podido identificar la documentos.",
      recordSaved: "documentos guardada correctamente.",

      selectRecordToDelete: "Selecciona una documentos para eliminar.",
      confirmDelete: "¿Seguro que quieres eliminar la documentos \"{name}\"?",
      deleteError: "Error al eliminar documentos",
      noRowsDeleted:
        "No se ha eliminado ninguna documentos. Revisa la policy DELETE de RLS en Supabase.",
      recordDeleted: "documentos eliminada correctamente.",

      factBoxTitle: "Datos principales",
      comingSoonTitle: "Próximamente",
      comingSoonText:
        "Aquí podremos mostrar el documento recibido, trazabilidad, aprobaciones o actividad reciente.",

      sourceType: "Origen",
      sourceTypeBlank: "",
      sourceTypeEmail: "Correo",
      sourceTypePortal: "Portal proveedor",
      sourceTypeApi: "API externa",
      sourceTypeManual: "Carga manual",
    },

    portalSupplierInvoiceLines: {
      title: "Líneas",
      addLine: "Añadir línea",
      deleteLine: "Eliminar",
      empty: "No hay líneas.",
      deleteSelectedLine: "Borrar",
      deleteAllLines: "Borrar todas",
      selectLineToDelete: "Selecciona una línea para borrar.",
      confirmDeleteAll:
        "Vas a borrar todas las líneas. Esta acción no se puede deshacer. ¿Quieres continuar?",
      recordsDeleted: "Líneas borradas correctamente.",
      saveError: "Error al guardar la línea",
      deleteError: "Error al eliminar la línea",
      recordSaved: "Línea guardada correctamente.",
      confirmDelete: "¿Seguro que quieres eliminar esta línea?",
      lineType: "Tipo",
      lineNo: "Nº",
      fiscalTreatment: "Tratamiento fiscal",
      purchaseLineTypeItem: "Artículo",
      purchaseLineTypeAccount: "Cuenta",
      description: "Descripción",
      quantity: "cant.",
      unitPrice: "Precio",
      discountRate: "% Desc.",
      discountAmount: "Importe Desc.",
      baseAmount: "Importe Base",
      vatRate: "% IVA",
      vatAmount: "Importe IVA",
      equivalenceSurchargeRate: "% RE",
      equivalenceSurchargeAmount: "Importe RE",
      withholdingRate: "% IRPF",
      withholdingAmount: "Importe IRPF",
      totalAmount: "Importe total",
    },

    documentFactBox: {
      title: "Adjuntos",
      selectRecord: "Selecciona un registro para ver sus adjuntos.",
      loading: "Cargando adjuntos...",
      empty: "Este registro no tiene adjuntos.",
      open: "Abrir",
      download: "Descargar",
      upload: "Cargar",
      uploading: "Cargando...",
      delete: "Eliminar",
      deleting: "Eliminando...",
      confirmDelete:
        "Vas a eliminar este adjunto. Esta acción no se puede deshacer. ¿Quieres continuar?",
      error: "Error",
    },

    emailConfigurations: {
      title: "Configuraciones correos",
      createTitle: "Nueva configuración de correo",
      editTitle: "Configuración de correo",
      backToList: "Volver a configuraciones correos",
      editSubtitle: "Configuración de envío de correo",

      applicationArea: "Aplicación",
      applicationAreaPurchasing: "Compras",
      applicationAreaSales: "Ventas",

      providerType: "Proveedor de envío",
      providerTypeSmtp: "SMTP",
      providerTypeMicrosoftGraph: "Microsoft 365 / Graph",

      authType: "Tipo de autenticación",
      authTypeBasic: "Usuario y contraseña",
      authTypeOauthClientCredentials: "OAuth aplicación",

      senderEmail: "Correo",
      senderName: "Nombre remitente",

      smtpHost: "Servidor SMTP",
      smtpPort: "Puerto",
      smtpUsername: "Usuario SMTP",
      smtpSecurityType: "Tipo de seguridad",
      smtpSecurityTypeBlank: "",
      smtpSecurityTypeNone: "Ninguna",
      smtpSecurityTypeSslTls: "SSL",
      smtpSecurityTypeStartTls: "TLS / STARTTLS",

      microsoftTenantId: "Tenant ID Microsoft",
      microsoftClientId: "Client ID Microsoft",
      microsoftMailboxEmail: "Buzón remitente Microsoft",

      isActive: "Activo",

      sectionGeneral: "General",
      emptyList: "No hay configuraciones de correo creadas.",
      listHelpText:
        "Selecciona una configuración y pulsa Editar. Solo puede existir una configuración por aplicación y empresa.",
      errorReading: "Error leyendo configuraciones de correo",
      noActiveCompanyDescription:
        "No hay una empresa activa. Selecciona una empresa para configurar correos.",
      createError: "Error al crear configuración de correo",
      saveError: "Error al guardar configuración de correo",
      noRecordId: "No se ha podido identificar la configuración de correo.",
      recordSaved: "Configuración de correo guardada correctamente.",
      selectRecordToDelete: "Selecciona una configuración de correo para eliminar.",
      confirmDelete:
        "¿Seguro que quieres eliminar la configuración de correo \"{name}\"?",
      deleteError: "Error al eliminar configuración de correo",
      noRowsDeleted: "No se ha eliminado ninguna configuración de correo.",
      recordDeleted: "Configuración de correo eliminada correctamente.",
      factBoxTitle: "Resumen",

      smtpPasswordTitle: "Contraseña SMTP",
      smtpPasswordDescription:
        "La contraseña SMTP no se muestra en la ficha. Informa una nueva contraseña solo cuando quieras cambiarla.",
      smtpPasswordPlaceholder: "Nueva contraseña SMTP",
      saveSmtpPassword: "Guardar contraseña SMTP",
      savingSmtpPassword: "Guardando contraseña...",
      smtpPasswordSaved: "Contraseña SMTP guardada correctamente.",

      microsoftSecretTitle: "Client secret Microsoft",
      microsoftSecretDescription:
        "Este secreto se usará más adelante para Microsoft 365 / Graph. No se muestra en la ficha.",
      microsoftSecretPlaceholder: "Nuevo client secret",
      saveMicrosoftSecret: "Guardar client secret",
      savingMicrosoftSecret: "Guardando client secret...",
      microsoftSecretSaved: "Client secret guardado correctamente.",

      testTitle: "Enviar correo de prueba",
      testDescription:
        "Indica un correo destino para probar esta configuración. La configuración debe estar activa y, actualmente, la prueba solo envía mediante SMTP con usuario y contraseña.",
      destinationEmail: "Correo destino",
      destinationEmailPlaceholder: "destino@empresa.com",
      sendTestEmail: "Enviar prueba",
      sendingTestEmail: "Enviando prueba...",
      testEmailSent: "Correo de prueba enviado correctamente.",
      requiredSecretError: "Debes informar un valor antes de guardar.",
    },

    chartOfAccounts: {
      title: "Plan contable",
      createTitle: "Nueva cuenta contable",
      editTitle: "Cuenta contable",
      backToList: "Volver al plan contable",
      editSubtitle: "Ficha de cuenta contable",

      code: "Código",
      description: "Descripción",
      isHeading: "Mayor",
      accountType: "Tipo",
      accountGroup: "Grupo",
      specialAccountCategory: "Categoría especial",
      fiscalTreatment: "Tratamiento fiscal",
      accountTypeSource: "Origen tipo",
      accountLevel: "Nivel",
      codeLength: "Longitud código",
      sortCode: "Código ordenación",

      accountTypeCurrentAsset: "Activo Corriente",
      accountTypeNonCurrentAsset: "Activo No corriente",
      accountTypeCurrentLiability: "Pasivo Corriente",
      accountTypeNonCurrentLiability: "Pasivo No corriente",
      accountTypeEquity: "Patrimonio Neto",
      accountTypeProfitAndLoss: "PyG",

      accountTypeSourceAuto: "Automático",
      accountTypeSourceManual: "Manual",

      accountGroupBasicFinancing: "1: Financiación Básica",
      accountGroupFixedAssets: "2: Inmovilizado",
      accountGroupInventories: "3: Existencias",
      accountGroupCreditorsDebtors: "4: Acreedores y Deudores",
      accountGroupFinancialAccounts: "5: Financieras",
      accountGroupExpenses: "6: Gastos",
      accountGroupIncome: "7: Ingresos",
      accountGroupOther: "Otros",

      specialAccountCategoryNone: "-",
      specialAccountCategoryPendingApplication: "Part. Pte. Aplicación",

      accountLevelGroup: "Grupo",
      accountLevelSubgroup: "Subgrupo",
      accountLevelAccount: "Cuenta",
      accountLevelDetail: "Detalle",

      sectionGeneral: "General",
      sectionTax: "Fiscalidad",
      factBoxTitle: "Resumen",

      emptyList: "No hay cuentas contables creadas todavía.",
      listHelpText:
        "Selecciona una cuenta y pulsa Editar. El grupo, nivel y ordenación se calculan automáticamente desde el código.",
      errorReading: "Error leyendo el plan contable",
      noActiveCompanyDescription:
        "No hay una empresa activa. Selecciona una empresa para gestionar el plan contable.",
      createError: "Error al crear cuenta contable",
      saveError: "Error al guardar cuenta contable",
      noRecordId: "No se ha podido identificar la cuenta contable.",
      recordSaved: "Cuenta contable guardada correctamente.",
      selectRecordToDelete: "Selecciona una cuenta contable para eliminar.",
      confirmDelete:
        "¿Seguro que quieres eliminar la cuenta contable \"{name}\"?",
      deleteError: "Error al eliminar cuenta contable",
      noRowsDeleted: "No se ha eliminado ninguna cuenta contable.",
      recordDeleted: "Cuenta contable eliminada correctamente.",
    },

    paymentChannels: {
      title: "Canales de pago",
      code: "Código",
      description: "Descripción",
      chartOfAccount: "Cuenta contable",
      emptyList: "No hay canales de pago creados todavía.",
      errorReading: "Error leyendo canales de pago",
      errorRefreshing: "Error actualizando canales de pago",

      grid: {
        deleteSelected: "Eliminar seleccionados",
        selectedSuffix: "seleccionado(s)",
        helpText:
          "La última fila sirve para crear un canal de pago nuevo. Informa Código y Descripción. La cuenta contable se selecciona desde el plan contable.",
        createRequiredFields:
          "Para crear un canal de pago informa al menos el Código.",
        requiredFields: "El Código es obligatorio.",
        saveError: "Error al guardar",
        createError: "Error al crear canal de pago",
        deleteError: "Error al eliminar canales de pago",
        recordCreated: "Canal de pago creado correctamente.",
        changeSaved: "Cambio guardado correctamente.",
        selectAtLeastOneToDelete:
          "Selecciona al menos un canal de pago para eliminar.",
        confirmDelete: "¿Seguro que quieres eliminar {count} canal(es) de pago?",
        noRowsDeleted:
          "No se ha eliminado ningún canal de pago. Revisa la policy DELETE de RLS en Supabase.",
        recordsDeleted: "Canales de pago eliminados correctamente.",
        invalidRelation: "Selecciona una cuenta contable válida.",
      },
    },

    taxAreas: {
      title: "Áreas de impuesto",
      code: "Código",
      description: "Descripción",
      emptyList: "No hay áreas de impuesto creadas todavía.",
      errorReading: "Error leyendo áreas de impuesto",
      errorRefreshing: "Error actualizando áreas de impuesto",

      grid: {
        deleteSelected: "Eliminar seleccionados",
        selectedSuffix: "seleccionado(s)",
        helpText:
          "La última fila sirve para crear un área de impuesto nueva. Informa Código y Descripción.",
        createRequiredFields:
          "Para crear un área de impuesto informa al menos el Código.",
        requiredFields: "El Código es obligatorio.",
        saveError: "Error al guardar",
        createError: "Error al crear área de impuesto",
        deleteError: "Error al eliminar áreas de impuesto",
        recordCreated: "Área de impuesto creada correctamente.",
        changeSaved: "Cambio guardado correctamente.",
        selectAtLeastOneToDelete:
          "Selecciona al menos un área de impuesto para eliminar.",
        confirmDelete:
          "¿Seguro que quieres eliminar {count} área(s) de impuesto?",
        noRowsDeleted:
          "No se ha eliminado ningún área de impuesto. Revisa la policy DELETE de RLS en Supabase.",
        recordsDeleted: "Áreas de impuesto eliminadas correctamente.",
        invalidRelation: "Selecciona un valor válido.",
      },
    },

    fiscalTreatments: {
      title: "Tratamientos fiscales",
      code: "Código",
      description: "Descripción",
      emptyList: "No hay tratamientos fiscales creados todavía.",
      errorReading: "Error leyendo tratamientos fiscales",
      errorRefreshing: "Error actualizando tratamientos fiscales",

      grid: {
        deleteSelected: "Eliminar seleccionados",
        selectedSuffix: "seleccionado(s)",
        helpText:
          "La última fila sirve para crear un tratamiento fiscal nuevo. Informa Código y Descripción.",
        createRequiredFields:
          "Para crear un tratamiento fiscal informa al menos el Código.",
        requiredFields: "El Código es obligatorio.",
        saveError: "Error al guardar",
        createError: "Error al crear tratamiento fiscal",
        deleteError: "Error al eliminar tratamientos fiscales",
        recordCreated: "Tratamiento fiscal creado correctamente.",
        changeSaved: "Cambio guardado correctamente.",
        selectAtLeastOneToDelete:
          "Selecciona al menos un tratamiento fiscal para eliminar.",
        confirmDelete:
          "¿Seguro que quieres eliminar {count} tratamiento(s) fiscal(es)?",
        noRowsDeleted:
          "No se ha eliminado ningún tratamiento fiscal. Revisa la policy DELETE de RLS en Supabase.",
        recordsDeleted: "Tratamientos fiscales eliminados correctamente.",
        invalidRelation: "Selecciona un valor válido.",
      },
    },

    taxConfigurations: {
      title: "Configuración impuestos",
      taxArea: "Área de impuesto",
      fiscalTreatment: "Tratamiento fiscal",
      description: "Descripción",
      taxType: "Tipo de impuesto",
      taxTypeNormal: "Normal",
      taxTypeNotSubject: "No sujeto",
      taxTypeReverseCharge: "Reversión",
      vatRate: "% IVA",
      equivalenceSurchargeRate: "% RE",
      inputTaxAccount: "Cuenta soportado",
      outputTaxAccount: "Cuenta repercutido",

      emptyList: "No hay configuraciones de impuestos creadas todavía.",
      errorReading: "Error leyendo configuración de impuestos",
      errorRefreshing: "Error actualizando configuración de impuestos",

      grid: {
        deleteSelected: "Eliminar seleccionadas",
        selectedSuffix: "seleccionada(s)",
        helpText:
          "Edita la configuración de impuestos directamente en la lista.",
        createRequiredFields:
          "Para crear una configuración informa Área de impuesto, Tratamiento fiscal, Descripción y Tipo de impuesto.",
        requiredFields:
          "Área de impuesto, Tratamiento fiscal, Descripción y Tipo de impuesto son obligatorios.",
        saveError: "Error al guardar",
        createError: "Error al crear configuración de impuestos",
        deleteError: "Error al eliminar configuración de impuestos",
        recordCreated: "Configuración de impuestos creada correctamente.",
        changeSaved: "Cambio guardado correctamente.",
        selectAtLeastOneToDelete:
          "Selecciona al menos una configuración para eliminar.",
        confirmDelete:
          "¿Seguro que quieres eliminar {count} configuración(es) de impuestos?",
        noRowsDeleted:
          "No se ha eliminado ninguna configuración. Revisa la policy DELETE de RLS en Supabase.",
        recordsDeleted: "Configuraciones de impuestos eliminadas correctamente.",
        invalidRelation: "Selecciona un valor válido.",
      },
    },

    emailSendLogs: {
      title: "Logs de correo",
      description: "Consulta los correos enviados correctamente desde la aplicación.",
      emptyList: "No hay logs de correo.",

      relatedType: "Relacionado con",
      relatedTypeTable: "Tabla",
      relatedTypeReport: "Report",
      relatedName: "Nombre relacionado",
      relatedRecordId: "Registro relacionado",
      senderEmail: "Remitente",
      recipientEmail: "Destinatario",
      sentAt: "Fecha envío",
    },

    modules: {
      portalTitle: "Portal",
      portalDescription:
        "Módulo preparado para el futuro portal de clientes y proveedores.",
      invoicingTitle: "Facturación",
      invoicingDescription:
        "Módulo preparado para la futura facturación sencilla con base VeriFactu.",
    },

    publicHome: {
      tagline: "Soluciones digitales para gestión empresarial",
      login: "Entrar",
      register: "Regístrate",
      badge: "Portal de proveedores/clientes · Facturación con VeriFactu",
      title: "App gastos susarros",
      description:
        "Centraliza la comunicación con clientes y proveedores, organiza documentos y prepara tu facturación en un entorno moderno, seguro y multiempresa.",
      portalTitle: "Portal clientes/proveedores",
      portalDescription:
        "Un espacio privado para compartir documentos, gestionar comunicaciones y ordenar la relación con tus clientes o proveedores desde un único entorno.",
      invoicingTitle: "Facturación con VeriFactu",
      invoicingDescription:
        "Una solución de facturación sencilla, pensada para emitir, consultar y organizar facturas, con una base preparada para adaptarse a los requisitos de VeriFactu.",
      offersTitle: "Qué ofrece la plataforma",
      secureAccessTitle: "Acceso seguro por usuario",
      secureAccessDescription:
        "Cada organización accede a su propio entorno privado con usuarios y permisos separados.",
      multiCompanyTitle: "Multiempresa",
      multiCompanyDescription:
        "Dentro de una misma cuenta puedes trabajar con varias empresas internas y mantener sus datos organizados.",
      roleBasedAccessTitle: "Acceso por roles",
      roleBasedAccessDescription:
        "Cada usuario accede a las áreas permitidas por su rol dentro del tenant.",
      inDevelopment: "En desarrollo",
      inDevelopmentDescription:
        "Estamos construyendo una base común para compartir usuarios, empresas y seguridad, evitando duplicidades y facilitando el crecimiento de la aplicación.",
    },

    auth: {
      back: "Volver",
      email: "Email",
      password: "Contraseña",

      loginTitle: "Entrar",
      loginDescription: "Accede a tu cuenta para gestionar tus datos.",
      loginButton: "Entrar",
      loggingIn: "Entrando...",
      noAccount: "¿No tienes cuenta?",
      createAccountLink: "Crear cuenta",

      registerTitle: "Crear cuenta",
      registerDescription: "Registra un usuario para empezar a usar la plataforma.",
      registerButton: "Crear cuenta",
      creatingAccount: "Creando...",
      alreadyHaveAccount: "¿Ya tienes cuenta?",
      loginLink: "Entrar",
      accountCreated:
        "Cuenta creada. Si Supabase requiere confirmación, revisa tu email. Si no, ya puedes entrar.",
    },

    accountPending: {
      statusLabel: "Cuenta pendiente",
      title: "Tu usuario no tiene un tenant activo asignado",
      description:
        "Has iniciado sesión correctamente, pero este usuario no está asociado a ningún cliente activo dentro de la aplicación.",
      userLabel: "Usuario",
      contactAdmin:
        "Ponte en contacto con los administradores para que revisen tu acceso o te asignen a un tenant.",
      backToLogin: "Volver al login",
    },

    logout: {
      loggingOut: "Cerrando sesión...",
    },

    admin: {
      menu: "Admin",
      tenants: "Tenants",
      title: "Administración",
      description: "Gestiona tenants y usuarios.",
      tenantUsers: "Usuarios por tenant",
      comingSoonTitle: "Página de administración preparada",
      comingSoonDescription:
        "Consulta y gestiona la estructura de usuarios y tenants.",
      usersWithoutTenant: "Usuarios sin tenant",
      usersWithoutTenantDescription:
        "Usuarios existentes en Supabase Auth que no tienen ningún tenant activo asignado.",
      tenantUsersDescription:
        "Usuarios asociados a tenants. Se muestra el email de Supabase Auth junto al tenant, rol y estado.",
      email: "Email",
      userId: "ID usuario",
      tenant: "Tenant",
      role: "Rol",
      status: "Estado",
      createdAt: "Creado",
      lastSignInAt: "Último acceso",
      assignTenant: "Asignar tenant",
      selectTenant: "Selecciona tenant",
      assign: "Asignar",
      userAssignedToTenant: "Usuario asignado correctamente al tenant.",
      noUsersWithoutTenant: "No hay usuarios sin tenant activo.",
      noTenantUsers: "No hay usuarios asignados a tenants.",
      usersWithoutTenantHelpText:
        "Al asignar un tenant, se crea o reactiva la relación en tenant_users con estado active.",
      searchUsersPlaceholder: "Buscar por email, ID, tenant, rol o estado",
      errorReadingTenantUsers: "Error leyendo usuarios por tenant",
      errorReadingTenants: "Error leyendo tenants",
    },

    adminTables: {
      emptyList: "No hay registros.",
      errorReading: "Error leyendo {table}.",
      readOnlyNotice:
        "Vista solo lectura. Los cambios se harán más adelante mediante acciones controladas.",
      columns: {
        id: "ID",
        code: "Código",
        name: "Nombre",
        description: "Descripción",
        active: "Activo",
        status: "Estado",
        role: "Rol",
        slug: "Slug",
        email: "Email",

        tenant_id: "Tenant ID",
        user_id: "Usuario ID",
        product_id: "Producto ID",
        plan_id: "Plan ID",
        subscription_id: "Suscripción ID",

        created_at: "Creado",
        updated_at: "Actualizado",
        starts_at: "Inicio",
        ends_at: "Fin",
        current_period_start: "Inicio periodo",
        current_period_end: "Fin periodo",
        canceled_at: "Cancelado",
        tenant: "Tenant",
        plan: "Plan",
        product: "Producto",
        user: "Usuario",
      },
    },

    supplierUpload: {
      title: "Subida de documento de proveedor",
      company: "Empresa",
      supplierTaxId: "CIF/NIF proveedor",
      invoiceNo: "Nº documento",
      invoiceDate: "Fecha factura",
      linesTitle: "Líneas de la factura",
      quantity: "Cant.",
      unitPrice: "Precio",
      discountAmount: "Importe Desc.",
      baseAmount: "Base",
      vatRate: "% IVA",
      equivalenceSurchargeRate: "% RE",
      withholdingRate: "% IRPF",
      totalInvoice: "Total documento",
      addLine: "Añadir línea",
      removeLine: "Quitar",
      file: "Archivo adjunto",
      confirmationEmailField: "Email confirmación",
      confirmationEmailHelp:
        "Se rellena automáticamente si el proveedor tiene email, pero puedes modificarlo o dejarlo vacío.",
      loadingConfirmationEmail: "Buscando email del proveedor...",
      submit: "Enviar documento",
      submitting: "Enviando...",
      successTitle: "Documento enviado",
      successDescription:
        "El documento se ha recibido correctamente. Hemos enviado un correo de confirmación.",
      errorTitle: "No se pudo enviar el documento",

      confirmationEmail: {
        subject: "Confirmación de subida de documento {invoiceNo}",
        title: "Documento recibido correctamente",
        intro: "Hemos recibido el documento enviado desde el portal de proveedores.",
        pendingReview: "La factura queda pendiente de revisión.",
        invoiceData: "Datos del documento",
        company: "Empresa",
        supplierTaxId: "CIF/NIF proveedor",
        invoiceNo: "Nº documento",
        invoiceDate: "Fecha documento",
        lineCount: "Nº de líneas",
        baseTotal: "Base total",
        invoiceTotal: "Total factura",
        footer:
          "Este mensaje confirma únicamente la recepción de la factura. La validación definitiva queda pendiente de revisión interna.",
      },

      errors: {
        invalidLines: "Las líneas de la factura no son válidas.",
        invalidBaseAmount: "La base de la línea {lineNumber} no es válida.",
        invalidVatRate: "El % IVA de la línea {lineNumber} no es válido. Si no lleva IVA, introduce un 0%",
        invalidEquivalenceSurchargeRate:
          "El % recargo equivalencia de la línea {lineNumber} no es válido.",
        invalidWithholdingRate: "El % IRPF de la línea {lineNumber} no es válido.",
        invalidUploadLink: "El enlace de subida no es válido.",
        unavailableUploadLink: "El enlace de subida no está disponible.",
        supplierTaxIdRequired: "El CIF/NIF del proveedor es obligatorio.",
        invalidDocumentType: "El tipo de documento no es válido.",
        invoiceNoRequired: "El número de documento es obligatorio.",
        invoiceDateRequired: "La fecha del documento es obligatoria.",
        invalidInvoiceDate: "La fecha del documento no es válida.",
        confirmationEmailRequired: "El email de confirmación es obligatorio.",
        invalidConfirmationEmail: "El email de confirmación no es válido.",
        linesRequired: "Debes informar al menos una línea.",
        fileRequired: "Debes adjuntar un archivo.",
        emptyFile: "El archivo adjunto está vacío.",
        maxFileSize: "El archivo no puede superar los 10 MB.",
        invalidFileType: "El archivo debe ser PDF, XML, JPG o PNG.",
        unsupportedStorage:
          "La subida desde el portal todavía solo está disponible con Supabase Storage.",
        supplierValidation: "No se pudo validar el proveedor.",
        supplierNotFound:
          "No se encontró ningún proveedor con ese CIF/NIF para esta empresa.",
        supplierWithoutEmail:
          "El proveedor encontrado no tiene email informado en su ficha.",
        invoiceCreateError: "No se pudo crear la factura.",
        linesCreateError: "No se pudieron crear las líneas.",
        fileUploadError: "No se pudo subir el archivo.",
        fileRecordError: "No se pudo registrar el archivo.",
      },
    },
    fieldVisibilityPreferences: {
      title: "Personalización de campos",
      description:
        "Configura qué campos se muestran por entidad, zona y usuario",
      entity: "Entidad",
      area: "Zona",
      applyTo: "Aplicar a",
      allUsers: "Todos los usuarios",
      currentUser: "Solo mi usuario",
      fields: "Campos",
      visible: "Visible",
      save: "Guardar",
      saving: "Guardando...",
      saved: "Preferencias guardadas.",
      saveError: "Error al guardar",
      showAll: "Mostrar todos",
      hideAll: "Ocultar todos",
      noFields: "No hay campos configurables.",

      list: "Lista",
      form: "Ficha",
      grid: "Líneas",
    },
  },

  en: {
    common: {
      appName: "Osolpor",
      loading: "Loading...",
      saving: "Saving...",
      deleting: "Deleting...",
      active: "Active",
      yes: "Yes",
      no: "No",
      open: "Open",
      back: "Back",
      cancel: "Cancel",
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      new: "New",
      actions: "Actions",
      noActionsAvailable: "No actions available",
      settings: "Settings",
      logout: "Log out",
      loggingOut: "Logging out...",
      changeLanguage: "Change language",
      currentLanguage: "Current language",
      tenantActive: "Active tenant",
      role: "Role",
      fieldRequired: "{field} is required.",
      search: "Search",
      searchPlaceholder: "Search...",
      clearSearch: "Clear search",
      applyFilters: "Apply filters",
      clearFilters: "Clear filters",
      all: "All",
      filters: "Filters",
      hideFilters: "Hide filters",
      invalidDateRange:
        "Invalid date format. Use 01/01/2026..31/01/2026.",
      activeCompany: "Active company",
      changeCompany: "Change company",
      currentCompany: "Current company",
      noActiveCompany: "No active company",
      noCompaniesAvailable: "No companies available",
      autoCreateHint: "Complete the required fields to create the record automatically.",

      currency: "Currency",
      currencyEur: "EUR",
      currencyUsd: "USD",
      currencyGbp: "GBP",

      documentType: "Type",
      documentTypeInvoice: "Invoice",
      documentTypeCreditNote: "Credit note",

      validations: {
        invalidIban: "The IBAN entered is not valid.",
        invalidEmailList:
          "The email entered is not valid. If you enter multiple emails, separate them with a semicolon (;).",
        invalidPercentage:
          "The percentage must be a number between 0 and 100, with a maximum of 2 decimal places.",
        invalidDecimal:
          "The number must be valid, with a maximum of 2 decimal places.",
        invalidContainsDot: "The field must contain at least one dot.",
        invalidDigitsOnly: "The field can only contain numbers.",
        invalidCountryCode: "The country code must have 2 letters.",
        invalidValue: "The value entered is not valid.",
        invalidOption: "The selected value is not valid.",
        invalidEmail: "The email entered is not valid.",
        invalidSmtpPort: "The SMTP port must be a number between 1 and 65535.",
      },

    },

    nav: {
      menu: "Menu",
      configurations: "Settings",
      treasury: "Treasury",
      companies: "Companies",
      suppliers: "Suppliers",
      countries: "Countries",
    },

    configurations: {
      title: "Settings",

      groups: {
        general: {
          title: "General",
        },
        purchasing: {
          title: "Purchasing",
        },
      },
    },

    list: {
      editList: "Edit list",
      viewList: "View list",
    },

    dashboard: {
      mainMenu: "Main menu",
      indicators: "Indicators and quick access",
      quickAction: "Quick action",
      newSupplier: "New supplier",
      treasury: "Treasury",
      registerExpense: "Register expense",
      totalBalance: "Total balance",
    },

    companies: {
      title: "Companies",
      name: "Name",
      taxId: "Tax ID",
      websiteUrl: "Website",
      phone: "Phone",
      address: "Address",
      city: "City",
      province: "Province",
      postalCode: "Postal code",
      country: "Country",
      emptyList: "There are no companies yet.",
      errorReading: "Error reading companies",
      errorRefreshing: "Error refreshing companies",
      backToCompanies: "Back to companies",
      editTitle: "Edit companies",
      editDescription:
        "Edit a cell and leave it to save automatically.",

      sectionGeneral: "General",
      sectionAddress: "Address",
      sectionDocumentSettings: "Document settings",
      sectionSupplierPortal: "Supplier portal",

      supplierPortalEnabled: "Supplier portal enabled",
      supplierUploadCode: "Public upload code",
      attachmentStorageProvider: "Store attachments in",
      storageProviderSupabaseStorage: "Supabase Storage",
      storageProviderSharePoint: "SharePoint",
      supplierPortalLanguage: "Portal language",
      supplierPortalLanguageEs: "Spanish",
      supplierPortalLanguageEn: "English",

      sectionPurchases: "Purchases",
      purchaseDefaultLineType: "Default type",
      purchaseLineTypeItem: "Item",
      purchaseLineTypeAccount: "Account",

      grid: {
        deleteSelected: "Delete selected",
        selectedSuffix: "selected",
        helpText:
          "The last row is used to create a new company. Enter Name, Tax ID and Country to create it automatically. To delete, select one or more rows and click Delete selected.",
        createRequiredFields:
          "To create a new company, enter Name, Tax ID and Country.",
        requiredFields: "Name and Tax ID are required.",
        invalidCountry: "Invalid country.",
        saveError: "Error saving",
        createError: "Error creating company",
        deleteError: "Error deleting companies",
        companyCreated: "Company created successfully.",
        changeSaved: "Change saved successfully.",
        selectAtLeastOneToDelete:
          "Select at least one company to delete.",
        confirmDelete:
          "Are you sure you want to delete {count} company/companies?",
        noRowsDeleted:
          "No company was deleted. Review the DELETE RLS policy in Supabase.",
        companiesDeleted: "Companies deleted successfully.",
      },
    },

    countries: {
      title: "Countries",
      code: "Code",
      name: "Name",
      isEu: "EU country",
      yes: "Yes",
      no: "No",
      emptyList: "There are no countries yet.",
      errorReading: "Error reading countries",
      errorRefreshing: "Error refreshing countries",

      fillEuCountries: "Fill EU countries (AI)",
      fillingEuCountries: "Filling...",

      grid: {
        deleteSelected: "Delete selected",
        selectedSuffix: "selected",
        helpText:
          "The last row is used to create a new country. Enter Code and Name. In EU country you can choose Yes or No. To delete, select one or more rows and click Delete selected.",
        createRequiredFields: "To create a country, enter Code and Name.",
        requiredFields: "Code and Name are required.",
        invalidCountryCode:
          "The country code must have 2 letters. Example: ES.",
        saveError: "Error saving",
        createError: "Error creating country",
        deleteError: "Error deleting countries",
        countryCreated: "Country created successfully.",
        changeSaved: "Change saved successfully.",
        selectAtLeastOneToDelete: "Select at least one country to delete.",
        confirmDelete: "Are you sure you want to delete {count} country/countries?",
        noRowsDeleted:
          "No country was deleted. Review the DELETE RLS policy in Supabase.",
        countriesDeleted: "Countries deleted successfully.",
      },

      ai: {
        missingApiKey: "Missing GEMINI_API_KEY environment variable.",
        geminiCallError: "Error calling Gemini",
        geminiNoContent: "Gemini did not return readable content.",
        geminiInvalidCountries:
          "Gemini did not return a valid country list.",
        noPermission: "You do not have permission to update countries.",
        noValidCountries: "Gemini did not return valid EU countries.",
        updateError: "Error updating countries",
        success: "EU countries updated successfully: {count}.",
        unexpected: "Unexpected error filling EU countries.",
      },
    },

    treasuryGeneral: {
      title: "General treasury",

      treasuryType: "Type",
      balance: "Balance",

      treasuryTypeRealIncome: "Actual income",
      treasuryTypeExpectedIncome: "Expected income",
      treasuryTypeRealExpense: "Actual expenses",
      treasuryTypeExpectedExpense: "Expected expenses",

      treasuryMovementAction: "Add movement",
      treasuryMovementsAction: "View movements",
      treasuryBalanceAction: "Total balance",
      treasuryMovementTitle: "New treasury movement",
      treasuryMovementType: "Type",
      treasuryMovementAmount: "Amount",
      treasuryMovementDate: "Date",
      treasuryMovementAccount: "G/L account",
      treasuryMovementAccountPlaceholder: "Search account by description",
      treasuryMovementSelectTypeFirst: "Select the type first",
      treasuryMovementAccountRequired: "The G/L account is required.",
      treasuryMovementAccountTypeMismatch:
        "The G/L account does not match the movement type.",
      treasuryMovementNoAccounts:
        "There are no G/L accounts available for movements.",
      treasuryMovementNoExpenseAccounts:
        "There are no available accounts in group 6: Expenses.",
      treasuryMovementNoIncomeAccounts:
        "There are no available accounts in group 7: Income.",
      treasuryMovementPaidBy: "Paid by",
      treasuryMovementPaidByPlaceholder:
        "Search member by first or last name",
      treasuryMovementPaidByRequired: "The paying member is required.",
      treasuryMovementNoMembers:
        "There are no members available. Create one in Settings.",
      treasuryMovementComment: "Comment",
      treasuryMovementCommentPlaceholder: "Optional comment",
      treasuryMovementSaving: "Saving...",
      treasuryMovementError: "Error creating treasury movement",
      accept: "Accept",
      close: "Close",

      emptyList: "There are no general treasury records.",
      errorReading: "Error reading general treasury",
      noActiveCompanyDescription:
        "There is no active company. Select a company to view general treasury.",
    },

    treasuryBalance: {
      title: "Treasury balance",
      backToTreasuryGeneral: "Back to general treasury",
      helpText:
        "Actual and expected income are added together. Within each account, actual expenses offset expected expenses and only the difference affects the balance.",
      date: "Date",
      accountNo: "Account",
      accountDescription: "Description",
      incomeGroup: "Income",
      expenseGroup: "Expenses",
      realShort: "Actual",
      expectedShort: "Expected",
      differenceShort: "Difference",
      realIncome: "Actual income",
      expectedIncome: "Expected income",
      realExpense: "Actual expenses",
      expectedExpense: "Expected expenses",
      expenseDifference: "Expense difference",
      balance: "Balance",
      total: "Grand total",
      totalBalance: "Total balance",
      emptyList: "There are no movements for the selected period.",
      errorReading: "Error reading treasury balance",
      noActiveCompanyDescription:
        "There is no active company. Select a company to view the balance.",
    },

    treasuryGeneralMovements: {
      title: "Treasury movements",
      backToTreasuryGeneral: "Back to general treasury",
      movementDate: "Date",
      treasuryType: "Type",
      accountDescription: "G/L account",
      paidBy: "Paid by",
      amount: "Amount",
      comment: "Comment",
      treasuryTypeRealIncome: "Actual income",
      treasuryTypeExpectedIncome: "Expected income",
      treasuryTypeRealExpense: "Actual expenses",
      treasuryTypeExpectedExpense: "Expected expenses",
      treasuryMovementEditAction: "Modify data",
      treasuryMovementEditTitle: "Modify treasury movement",
      treasuryMovementType: "Type",
      treasuryMovementAmount: "Amount",
      treasuryMovementDate: "Date",
      treasuryMovementAccount: "G/L account",
      treasuryMovementAccountPlaceholder: "Search account by description",
      treasuryMovementSelectTypeFirst: "Select the type first",
      treasuryMovementAccountRequired: "The G/L account is required.",
      treasuryMovementAccountTypeMismatch:
        "The G/L account does not match the movement type.",
      treasuryMovementNoAccounts:
        "There are no G/L accounts available for movements.",
      treasuryMovementNoExpenseAccounts:
        "There are no available accounts in group 6: Expenses.",
      treasuryMovementNoIncomeAccounts:
        "There are no available accounts in group 7: Income.",
      treasuryMovementPaidBy: "Paid by",
      treasuryMovementPaidByPlaceholder:
        "Search member by first or last name",
      treasuryMovementPaidByRequired: "The paying member is required.",
      treasuryMovementNoMembers:
        "There are no members available. Create one in Settings.",
      treasuryMovementComment: "Comment",
      treasuryMovementCommentPlaceholder: "Optional comment",
      treasuryMovementUpdate: "Modify",
      treasuryMovementUpdating: "Updating...",
      treasuryMovementUpdateError: "Error updating treasury movement",
      close: "Close",
      emptyList: "There are no treasury movements.",
      listHelpText:
        "Review registered movements and use the filters to find income or expenses.",
      errorReading: "Error reading treasury movements",
      noActiveCompanyDescription:
        "There is no active company. Select a company to view movements.",
      selectRecordToDelete: "Select a movement to delete.",
      confirmDelete:
        "Are you sure you want to delete the movement for \"{name}\"?",
      deleteError: "Error deleting treasury movement",
      noRowsDeleted: "No treasury movement was deleted.",
      recordDeleted: "Treasury movement deleted successfully.",
    },

    treasuryMembers: {
      title: "Members",
      firstName: "First name",
      lastName: "Last name",
      isDefault: "Default",
      isGuest: "Guest",
      emptyList: "There are no members.",
      errorReading: "Error reading members",
      errorRefreshing: "Error refreshing members",
      noActiveCompanyDescription:
        "There is no active company. Select a company to manage members.",
      grid: {
        deleteSelected: "Delete selected",
        selectedSuffix: "selected",
        helpText:
          "Edit members directly in the list. Only one member can be the default.",
        createRequiredFields:
          "Enter First name and Last name to create a member.",
        requiredFields: "First name and Last name are required.",
        saveError: "Error saving member",
        createError: "Error creating member",
        deleteError: "Error deleting members",
        recordCreated: "Member created successfully.",
        changeSaved: "Member updated successfully.",
        selectAtLeastOneToDelete:
          "Select at least one member to delete.",
        confirmDelete: "Are you sure you want to delete {count} member(s)?",
        noRowsDeleted: "No members were deleted.",
        recordsDeleted: "Members deleted successfully.",
      },
    },

    items: {
      title: "Items",
      createTitle: "New item",
      editTitle: "Item",
      backToList: "Back to items",
      editSubtitle: "Item · {description}",

      code: "Code",
      description: "Description",
      itemType: "Item type",
      itemTypeProduct: "Product",
      itemTypeService: "Service",
      itemTypeExpense: "Expense",
      itemTypeOther: "Other",
      category: "Category",
      baseUnitOfMeasure: "Base unit of measure",
      unitUnd: "UNIT",
      unitKg: "KG",
      unitG: "G",
      unitL: "L",
      unitM: "M",
      unitH: "H",
      unitBox: "Box",
      unitPack: "Pack",
      barcode: "Barcode",
      preferredSupplier: "Preferred supplier",
      purchasePrice: "Purchase price",
      salesPrice: "Sales price",
      unitCost: "Unit cost",
      isActive: "Active",
      fiscalTreatment: "Fiscal treatment",
      inventory: "Inventory (base)",

      sectionGeneral: "General",
      sectionPurchaseSales: "Purchases and sales",

      emptyList: "There are no items yet.",
      listHelpText:
        "Select an item and click Edit. You can also double-click a row to open the card.",
      errorReading: "Error reading items",
      noActiveCompanyDescription:
        "There is no active company. Select a company to work with items.",

      createError: "Error creating item",
      saveError: "Error saving item",
      noRecordId: "The item could not be identified.",
      recordSaved: "Item saved successfully.",

      selectRecordToDelete: "Select an item to delete.",
      confirmDelete: "Are you sure you want to delete item \"{name}\"?",
      deleteError: "Error deleting item",
      noRowsDeleted:
        "No item was deleted. Review the DELETE RLS policy in Supabase.",
      recordDeleted: "Item deleted successfully.",

      factBoxTitle: "Main details",
      comingSoonTitle: "Coming soon",
      comingSoonText:
        "Here we will be able to show stock, movements, prices, traceability or recent activity.",

      balanceAction: "Balance",
      inventoryAdjustmentAction: "Inventory adjustment",
      inventoryAdjustmentTitle: "Inventory adjustment",
      selectedItem: "Item",
      selectedItemDescription: "Description",
      postingDate: "Posting date",
      adjustmentEntryType: "Type",
      adjustmentEntryTypeIn: "In",
      adjustmentEntryTypeOut: "Out",
      documentNo: "Document No.",
      quantity: "Quantity",
      unitOfMeasure: "Unit of measure",
      accept: "Accept",
      adjusting: "Adjusting...",
      close: "Close",
      adjustmentCreated: "Inventory adjustment created successfully.",
      adjustmentError: "Error creating adjustment",
    },

    itemBalanceEntries: {
      title: "Item balance",
      createTitle: "New balance entry",
      editTitle: "Balance entry",
      backToList: "Back to item balance",
      editSubtitle: "Balance · {itemDescription}",

      item: "Item",
      itemCode: "Item code",
      itemDescription: "Item description",
      entryType: "Type",
      entryTypeIn: "In",
      entryTypeOut: "Out",
      quantity: "Quantity",
      createdAt: "Date",

      postingDate: "Posting date",
      documentNo: "Document No.",
      origin: "Origin",
      originPurchase: "Purchase",
      originSale: "Sale",
      originAdjustment: "Adjustment",
      unitOfMeasure: "Unit of measure",

      emptyList: "There are no balance entries for this item.",
      listHelpText:
        "Balance entry list for the selected item. This page is read-only.",
      errorReading: "Error reading item balance",
      noActiveCompanyDescription:
        "There is no active company. Select a company to view item balance.",

      createError: "Entries cannot be created from this page.",
      saveError: "Entries cannot be modified from this page.",
      noRecordId: "The balance entry could not be identified.",
      recordSaved: "Balance entry saved successfully.",

      selectRecordToDelete: "Select a balance entry to delete.",
      confirmDelete: "Are you sure you want to delete balance entry \"{name}\"?",
      deleteError: "Error deleting balance entry",
      noRowsDeleted:
        "No balance entry was deleted. Review the DELETE RLS policy in Supabase.",
      recordDeleted: "Balance entry deleted successfully.",

      factBoxTitle: "Main details",
      comingSoonTitle: "Coming soon",
      comingSoonText:
        "Here we will be able to show movement detail or traceability.",
    },

    suppliers: {
      title: "Suppliers",
      summaryTitle: "Supplier summary",
      suppliers: "Suppliers",
      createTitle: "New Supplier",
      usedCountries: "Used countries",
      lastSupplier: "Last supplier",
      noLastSupplier: "There are no suppliers yet.",
      quickHelp: "Quick help",
      quickHelpText:
        "Select a supplier from the list and click Edit to open its card. You can also click directly on the name or double-click the row.",
      noEmail: "No email",
      errorReading: "Error reading suppliers",

      name: "Name",
      commercialName: "Commercial name",
      taxId: "Tax ID",
      taxArea: "Tax area",
      code: "Code",
      withholdingRate: "Withholding %",
      preferredIban: "Preferred IBAN",
      email: "Email",
      websiteUrl: "Website",
      phone: "Phone",
      address: "Address",
      city: "City",
      province: "Province",
      postalCode: "Postal code",
      country: "Country",
      paymentChannel: "Payment channel",
      portalDefaultLineType: "Default portal type",
      portalDefaultLineNo: "Default portal no.",
      pricesIncludeVat: "Prices include VAT",
      purchaseLineTypeItem: "Item",
      purchaseLineTypeAccount: "Account",
      tenant: "Tenant",

      emptyList: "There are no suppliers yet.",
      listHelpText:
        "Select a row and click Edit. You can also double-click a row to open the card. Delete only removes the selected supplier.",

      backToSuppliers: "Back to suppliers",
      newTitle: "New supplier",
      editSubtitle: "Supplier card · {taxId}",

      selectCountry: "Select country",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",

      nameRequired: "Name is required.",
      taxIdRequired: "Tax ID is required.",
      countryRequired: "Country is required.",
      createError: "Error creating supplier",
      saveError: "Error saving supplier",
      noSupplierId: "The supplier could not be identified.",
      supplierSaved: "Supplier saved successfully.",

      selectSupplierToDelete: "Select a supplier to delete.",
      confirmDelete: "Are you sure you want to delete supplier \"{name}\"?",
      deleteError: "Error deleting supplier",
      noRowsDeleted:
        "No supplier was deleted. Review the DELETE RLS policy in Supabase.",
      supplierDeleted: "Supplier deleted successfully.",

      factBoxTitle: "Main details",
      locationTitle: "Location",
      noAddress: "No address",
      noLocation: "No city",
      comingSoonTitle: "Coming soon",
      comingSoonText:
        "Here we will be able to show documents, contacts, received invoices, portal messages or recent supplier activity.",

      newFactBoxTitle: "New supplier",
      requiredFieldsHelp: "Required fields are Name, Tax ID and Country.",
      countriesAvailableTitle: "Available countries",
      company: "Company",
      newDescription: "Create a supplier card for the active company.",
      noActiveCompanyDescription:
        "There is no active company. Create or select a company to work with suppliers.",
      countriesAvailableText:
        "The country is selected from the country master configured for the active tenant.",

      sectionGeneral: "General",
      sectionAddressAndContact: "Address and contact",
      sectionSupplierPortal: "Supplier portal",
    },

    portalSupplierInvoices: {
      title: "Supplier portal documents",
      createTitle: "New supplier portal invoice",
      editTitle: "Supplier portal invoice",
      backToList: "Back to supplier portal invoices",
      editSubtitle: "Invoice · {invoiceNo}",

      invoiceNo: "Document no.",
      supplierNo: "Supplier no.",
      country: "Country",
      paymentChannel: "Payment channel",
      taxArea: "Tax area",
      postingDate: "Posting date",
      invoiceDate: "Invoice date",
      exchangeRate: "Exchange rate",
      totalBaseAmount: "Total Base Amount",
      totalVatAmount: "Total VAT amount",
      totalAmount: "Total amount",
      status: "Status",
      hasAttachments: "Attachments",

      sectionGeneral: "General",
      totalsSectionTitle: "Totals",

      emptyList: "There are no supplier portal invoices.",
      listHelpText:
        "Select an invoice and click Edit. You can also double-click a row to open the card.",
      errorReading: "Error reading supplier portal invoices",
      noActiveCompanyDescription:
        "There is no active company. Select a company to work with supplier portal invoices.",

      createError: "Error creating invoice",
      saveError: "Error saving invoice",
      noRecordId: "The invoice could not be identified.",
      recordSaved: "Invoice saved successfully.",

      selectRecordToDelete: "Select an invoice to delete.",
      confirmDelete: "Are you sure you want to delete invoice \"{name}\"?",
      deleteError: "Error deleting invoice",
      noRowsDeleted:
        "No invoice was deleted. Review the DELETE RLS policy in Supabase.",
      recordDeleted: "Invoice deleted successfully.",

      factBoxTitle: "Main details",
      comingSoonTitle: "Coming soon",
      comingSoonText:
        "Here we will be able to show the received document, portal traceability, approvals or recent activity.",

      sourceType: "Source",
      sourceTypeBlank: "",
      sourceTypeEmail: "Email",
      sourceTypePortal: "Supplier portal",
      sourceTypeApi: "External API",
      sourceTypeManual: "Manual upload",
    },

    purchaseInvoices: {
      title: "Purchase invoices",
      createTitle: "New purchase invoice",
      editTitle: "Purchase invoice",
      backToList: "Back to purchase invoices",
      editSubtitle: "Invoice · {invoiceNo}",

      invoiceNo: "Document no.",
      supplierNo: "Supplier no.",
      country: "Country",
      paymentChannel: "Payment channel",
      taxArea: "Tax area",
      postingDate: "Posting date",
      invoiceDate: "Invoice date",
      exchangeRate: "Exchange rate",
      totalBaseAmount: "Total Base Amount",
      totalVatAmount: "Total VAT amount",
      totalAmount: "Total amount",
      status: "Status",
      hasAttachments: "Attachments",

      sectionGeneral: "General",
      totalsSectionTitle: "Totals",

      emptyList: "There are no purchase invoices.",
      listHelpText:
        "Select an invoice and click Edit. You can also double-click a row to open the card.",
      errorReading: "Error reading purchase invoices",
      noActiveCompanyDescription:
        "There is no active company. Select a company to work with purchase invoices.",

      createError: "Error creating invoice",
      saveError: "Error saving invoice",
      noRecordId: "The invoice could not be identified.",
      recordSaved: "Invoice saved successfully.",

      selectRecordToDelete: "Select an invoice to delete.",
      confirmDelete: "Are you sure you want to delete invoice \"{name}\"?",
      deleteError: "Error deleting invoice",
      noRowsDeleted:
        "No invoice was deleted. Review the DELETE RLS policy in Supabase.",
      recordDeleted: "Invoice deleted successfully.",

      factBoxTitle: "Main details",
      comingSoonTitle: "Coming soon",
      comingSoonText:
        "Here we will be able to show the received document, traceability, approvals or recent activity.",

      sourceType: "Source",
      sourceTypeBlank: "",
      sourceTypeEmail: "Email",
      sourceTypePortal: "Supplier portal",
      sourceTypeApi: "External API",
      sourceTypeManual: "Manual upload",
    },

    portalSupplierInvoiceLines: {
      title: "Lines",
      baseAmount: "Base",
      vatRate: "VAT %",
      vatAmount: "VAT Amount",
      equivalenceSurchargeRate: "ES %",
      equivalenceSurchargeAmount: "ES Amount",
      withholdingRate: "WH %",
      withholdingAmount: "WH Amount",
      totalAmount: "Total Amount",
      addLine: "Add line",
      deleteLine: "Delete",
      empty: "There are no lines.",
      deleteSelectedLine: "Delete",
      deleteAllLines: "Delete all",
      selectLineToDelete: "Select a line to delete.",
      confirmDeleteAll:
        "You are about to delete all lines. This action cannot be undone. Do you want to continue?",
      recordsDeleted: "Lines deleted successfully.",
      saveError: "Error saving line",
      deleteError: "Error deleting line",
      recordSaved: "Line saved successfully.",
      confirmDelete: "Are you sure you want to delete this line?",
      lineType: "Type",
      lineNo: "No.",
      fiscalTreatment: "Fiscal treatment",
      purchaseLineTypeItem: "Item",
      purchaseLineTypeAccount: "Account",
      description: "Description",
      quantity: "Qty.",
      unitPrice: "Price",
      discountRate: "Disc. %",
      discountAmount: "Disc. Amount",
    },

    documentFactBox: {
      title: "Attachments",
      selectRecord: "Select a record to view its attachments.",
      loading: "Loading attachments...",
      empty: "This record has no attachments.",
      open: "Open",
      download: "Download",
      upload: "Upload",
      uploading: "Uploading...",
      delete: "Delete",
      deleting: "Deleting...",
      confirmDelete:
        "You are about to delete this attachment. This action cannot be undone. Do you want to continue?",
      error: "Error",
    },

    emailConfigurations: {
      title: "Email settings",
      createTitle: "New email setting",
      editTitle: "Email setting",
      backToList: "Back to email settings",
      editSubtitle: "Email sending configuration",

      applicationArea: "Application",
      applicationAreaPurchasing: "Purchasing",
      applicationAreaSales: "Sales",

      providerType: "Sending provider",
      providerTypeSmtp: "SMTP",
      providerTypeMicrosoftGraph: "Microsoft 365 / Graph",

      authType: "Authentication type",
      authTypeBasic: "User and password",
      authTypeOauthClientCredentials: "OAuth application",

      senderEmail: "Email",
      senderName: "Sender name",

      smtpHost: "SMTP server",
      smtpPort: "Port",
      smtpUsername: "SMTP user",
      smtpSecurityType: "Security type",
      smtpSecurityTypeBlank: "",
      smtpSecurityTypeNone: "None",
      smtpSecurityTypeSslTls: "SSL",
      smtpSecurityTypeStartTls: "TLS / STARTTLS",

      microsoftTenantId: "Microsoft tenant ID",
      microsoftClientId: "Microsoft client ID",
      microsoftMailboxEmail: "Microsoft sender mailbox",

      isActive: "Active",

      sectionGeneral: "General",
      emptyList: "There are no email settings yet.",
      listHelpText:
        "Select a setting and click Edit. There can only be one setting per application and company.",
      errorReading: "Error reading email settings",
      noActiveCompanyDescription:
        "There is no active company. Select a company to configure email.",
      createError: "Error creating email setting",
      saveError: "Error saving email setting",
      noRecordId: "The email setting could not be identified.",
      recordSaved: "Email setting saved successfully.",
      selectRecordToDelete: "Select an email setting to delete.",
      confirmDelete: "Are you sure you want to delete email setting \"{name}\"?",
      deleteError: "Error deleting email setting",
      noRowsDeleted: "No email setting was deleted.",
      recordDeleted: "Email setting deleted successfully.",
      factBoxTitle: "Summary",

      smtpPasswordTitle: "SMTP password",
      smtpPasswordDescription:
        "The SMTP password is not shown on the card. Enter a new password only when you want to change it.",
      smtpPasswordPlaceholder: "New SMTP password",
      saveSmtpPassword: "Save SMTP password",
      savingSmtpPassword: "Saving password...",
      smtpPasswordSaved: "SMTP password saved successfully.",

      microsoftSecretTitle: "Microsoft client secret",
      microsoftSecretDescription:
        "This secret will be used later for Microsoft 365 / Graph. It is not shown on the card.",
      microsoftSecretPlaceholder: "New client secret",
      saveMicrosoftSecret: "Save client secret",
      savingMicrosoftSecret: "Saving client secret...",
      microsoftSecretSaved: "Client secret saved successfully.",

      testTitle: "Send test email",
      testDescription:
        "Enter a destination email to test this configuration. The configuration must be active and, currently, the test only sends through SMTP with user and password.",
      destinationEmail: "Destination email",
      destinationEmailPlaceholder: "destination@company.com",
      sendTestEmail: "Send test",
      sendingTestEmail: "Sending test...",
      testEmailSent: "Test email sent successfully.",
      requiredSecretError: "You must enter a value before saving.",
    },

    chartOfAccounts: {
      title: "Chart of accounts",
      createTitle: "New G/L account",
      editTitle: "G/L account",
      backToList: "Back to chart of accounts",
      editSubtitle: "G/L account card",

      code: "Code",
      description: "Description",
      isHeading: "Heading",
      accountType: "Type",
      accountGroup: "Group",
      specialAccountCategory: "Special category",
      fiscalTreatment: "Fiscal treatment",
      accountTypeSource: "Type source",
      accountLevel: "Level",
      codeLength: "Code length",
      sortCode: "Sort code",

      accountTypeCurrentAsset: "Current asset",
      accountTypeNonCurrentAsset: "Non-current asset",
      accountTypeCurrentLiability: "Current liability",
      accountTypeNonCurrentLiability: "Non-current liability",
      accountTypeEquity: "Equity",
      accountTypeProfitAndLoss: "P&L",

      accountTypeSourceAuto: "Automatic",
      accountTypeSourceManual: "Manual",

      accountGroupBasicFinancing: "1: Basic financing",
      accountGroupFixedAssets: "2: Fixed assets",
      accountGroupInventories: "3: Inventories",
      accountGroupCreditorsDebtors: "4: Creditors and debtors",
      accountGroupFinancialAccounts: "5: Financial accounts",
      accountGroupExpenses: "6: Expenses",
      accountGroupIncome: "7: Income",
      accountGroupOther: "Other",

      specialAccountCategoryNone: "-",
      specialAccountCategoryPendingApplication: "Pending application",

      accountLevelGroup: "Group",
      accountLevelSubgroup: "Subgroup",
      accountLevelAccount: "Account",
      accountLevelDetail: "Detail",

      sectionGeneral: "General",
      sectionTax: "Tax",
      factBoxTitle: "Summary",

      emptyList: "No G/L accounts have been created yet.",
      listHelpText:
        "Select an account and click Edit. Group, level and sorting are calculated automatically from the code.",
      errorReading: "Error reading chart of accounts",
      noActiveCompanyDescription:
        "There is no active company. Select a company to manage the chart of accounts.",
      createError: "Error creating G/L account",
      saveError: "Error saving G/L account",
      noRecordId: "The G/L account could not be identified.",
      recordSaved: "G/L account saved successfully.",
      selectRecordToDelete: "Select a G/L account to delete.",
      confirmDelete: "Are you sure you want to delete G/L account \"{name}\"?",
      deleteError: "Error deleting G/L account",
      noRowsDeleted: "No G/L account was deleted.",
      recordDeleted: "G/L account deleted successfully.",
    },

    paymentChannels: {
      title: "Payment channels",
      code: "Code",
      description: "Description",
      chartOfAccount: "G/L account",
      emptyList: "There are no payment channels yet.",
      errorReading: "Error reading payment channels",
      errorRefreshing: "Error refreshing payment channels",

      grid: {
        deleteSelected: "Delete selected",
        selectedSuffix: "selected",
        helpText:
          "The last row is used to create a new payment channel. Enter Code and Description. The G/L account is selected from the chart of accounts.",
        createRequiredFields:
          "To create a payment channel, enter at least the Code.",
        requiredFields: "Code is required.",
        saveError: "Error saving",
        createError: "Error creating payment channel",
        deleteError: "Error deleting payment channels",
        recordCreated: "Payment channel created successfully.",
        changeSaved: "Change saved successfully.",
        selectAtLeastOneToDelete:
          "Select at least one payment channel to delete.",
        confirmDelete:
          "Are you sure you want to delete {count} payment channel(s)?",
        noRowsDeleted:
          "No payment channel was deleted. Review the DELETE RLS policy in Supabase.",
        recordsDeleted: "Payment channels deleted successfully.",
        invalidRelation: "Select a valid G/L account.",
      },
    },

    taxAreas: {
      title: "Tax areas",
      code: "Code",
      description: "Description",
      emptyList: "There are no tax areas yet.",
      errorReading: "Error reading tax areas",
      errorRefreshing: "Error refreshing tax areas",

      grid: {
        deleteSelected: "Delete selected",
        selectedSuffix: "selected",
        helpText:
          "The last row is used to create a new tax area. Enter Code and Description.",
        createRequiredFields: "To create a tax area, enter at least the Code.",
        requiredFields: "Code is required.",
        saveError: "Error saving",
        createError: "Error creating tax area",
        deleteError: "Error deleting tax areas",
        recordCreated: "Tax area created successfully.",
        changeSaved: "Change saved successfully.",
        selectAtLeastOneToDelete:
          "Select at least one tax area to delete.",
        confirmDelete: "Are you sure you want to delete {count} tax area(s)?",
        noRowsDeleted:
          "No tax area was deleted. Review the DELETE RLS policy in Supabase.",
        recordsDeleted: "Tax areas deleted successfully.",
        invalidRelation: "Select a valid value.",
      },
    },

    fiscalTreatments: {
      title: "Fiscal treatments",
      code: "Code",
      description: "Description",
      emptyList: "There are no fiscal treatments yet.",
      errorReading: "Error reading fiscal treatments",
      errorRefreshing: "Error refreshing fiscal treatments",

      grid: {
        deleteSelected: "Delete selected",
        selectedSuffix: "selected",
        helpText:
          "The last row is used to create a new fiscal treatment. Enter Code and Description.",
        createRequiredFields:
          "To create a fiscal treatment, enter at least the Code.",
        requiredFields: "Code is required.",
        saveError: "Error saving",
        createError: "Error creating fiscal treatment",
        deleteError: "Error deleting fiscal treatments",
        recordCreated: "Fiscal treatment created successfully.",
        changeSaved: "Change saved successfully.",
        selectAtLeastOneToDelete:
          "Select at least one fiscal treatment to delete.",
        confirmDelete:
          "Are you sure you want to delete {count} fiscal treatment(s)?",
        noRowsDeleted:
          "No fiscal treatment was deleted. Review the DELETE RLS policy in Supabase.",
        recordsDeleted: "Fiscal treatments deleted successfully.",
        invalidRelation: "Select a valid value.",
      },
    },

    taxConfigurations: {
      title: "Tax configurations",
      taxArea: "Tax area",
      fiscalTreatment: "Fiscal treatment",
      description: "Description",
      taxType: "Tax type",
      taxTypeNormal: "Normal",
      taxTypeNotSubject: "Not subject",
      taxTypeReverseCharge: "Reverse charge",
      vatRate: "VAT %",
      equivalenceSurchargeRate: "Eq. surcharge %",
      inputTaxAccount: "Input tax account",
      outputTaxAccount: "Output tax account",

      emptyList: "There are no tax configurations yet.",
      errorReading: "Error reading tax configurations",
      errorRefreshing: "Error refreshing tax configurations",

      grid: {
        deleteSelected: "Delete selected",
        selectedSuffix: "selected",
        helpText:
          "Edit tax configurations directly in the list.",
        createRequiredFields:
          "To create a tax configuration, enter Tax area, Fiscal treatment, Description and Tax type.",
        requiredFields:
          "Tax area, Fiscal treatment, Description and Tax type are required.",
        saveError: "Error saving",
        createError: "Error creating tax configuration",
        deleteError: "Error deleting tax configurations",
        recordCreated: "Tax configuration created successfully.",
        changeSaved: "Change saved successfully.",
        selectAtLeastOneToDelete:
          "Select at least one tax configuration to delete.",
        confirmDelete:
          "Are you sure you want to delete {count} tax configuration(s)?",
        noRowsDeleted:
          "No tax configuration was deleted. Review the DELETE RLS policy in Supabase.",
        recordsDeleted: "Tax configurations deleted successfully.",
        invalidRelation: "Select a valid value.",
      },
    },

    emailSendLogs: {
      title: "Email logs",
      description: "Review emails successfully sent from the application.",
      emptyList: "There are no email logs.",

      relatedType: "Related to",
      relatedTypeTable: "Table",
      relatedTypeReport: "Report",
      relatedName: "Related name",
      relatedRecordId: "Related record",
      senderEmail: "Sender",
      recipientEmail: "Recipient",
      sentAt: "Sent at",
    },

    modules: {
      portalTitle: "Portal",
      portalDescription:
        "Module prepared for the future customer and supplier portal.",
      invoicingTitle: "Invoicing",
      invoicingDescription:
        "Module prepared for future simple invoicing with a VeriFactu-ready base.",
    },

    publicHome: {
      tagline: "Digital solutions for business management",
      login: "Log in",
      register: "Sign up",
      badge: "Supplier/customer portal · VeriFactu invoicing",
      title: "App gastos susarros",
      description:
        "Centralize communication with customers and suppliers, organize documents and prepare your invoicing in a modern, secure, multi-company environment.",
      portalTitle: "Customer/supplier portal",
      portalDescription:
        "A private space to share documents, manage communications and organize the relationship with your customers or suppliers from a single environment.",
      invoicingTitle: "VeriFactu invoicing",
      invoicingDescription:
        "A simple invoicing solution designed to issue, review and organize invoices, with a base prepared to adapt to VeriFactu requirements.",
      offersTitle: "What the platform offers",
      secureAccessTitle: "Secure user access",
      secureAccessDescription:
        "Each organization accesses its own private environment with separate users and permissions.",
      multiCompanyTitle: "Multi-company",
      multiCompanyDescription:
        "Within the same account you can work with several internal companies and keep their data organized.",
      roleBasedAccessTitle: "Role-based access",
      roleBasedAccessDescription:
        "Each user accesses the areas allowed by their role within the tenant.",
      inDevelopment: "In development",
      inDevelopmentDescription:
        "We are building a common base for shared users, companies and security, avoiding duplication and making the application easier to scale.",
    },

    auth: {
      back: "Back",
      email: "Email",
      password: "Password",

      loginTitle: "Log in",
      loginDescription: "Access your account to manage your data.",
      loginButton: "Log in",
      loggingIn: "Logging in...",
      noAccount: "Don't have an account?",
      createAccountLink: "Create account",

      registerTitle: "Create account",
      registerDescription: "Register a user to start using the platform.",
      registerButton: "Create account",
      creatingAccount: "Creating...",
      alreadyHaveAccount: "Already have an account?",
      loginLink: "Log in",
      accountCreated:
        "Account created. If Supabase requires confirmation, check your email. Otherwise, you can now log in.",
    },

    accountPending: {
      statusLabel: "Pending account",
      title: "Your user does not have an active tenant assigned",
      description:
        "You have signed in successfully, but this user is not associated with any active customer in the application.",
      userLabel: "User",
      contactAdmin:
        "Contact the administrators so they can review your access or assign you to a tenant.",
      backToLogin: "Back to login",
    },

    logout: {
      loggingOut: "Logging out...",
    },

    admin: {
      menu: "Admin",
      tenants: "Tenants",
      title: "Administration",
      description: "Manage tenants and users.",
      tenantUsers: "Tenant users",
      comingSoonTitle: "Administration page ready",
      comingSoonDescription:
        "Review and manage the tenant and user structure.",
      usersWithoutTenant: "Users without tenant",
      usersWithoutTenantDescription:
        "Users that exist in Supabase Auth but do not have any active tenant assigned.",
      tenantUsersDescription:
        "Users associated with tenants. The Supabase Auth email is shown together with the tenant, role and status.",
      email: "Email",
      userId: "User ID",
      tenant: "Tenant",
      role: "Role",
      status: "Status",
      createdAt: "Created",
      lastSignInAt: "Last sign-in",
      assignTenant: "Assign tenant",
      selectTenant: "Select tenant",
      assign: "Assign",
      userAssignedToTenant: "User successfully assigned to the tenant.",
      noUsersWithoutTenant: "There are no users without an active tenant.",
      noTenantUsers: "There are no users assigned to tenants.",
      usersWithoutTenantHelpText:
        "Assigning a tenant creates or reactivates the tenant_users relation with active status.",
      searchUsersPlaceholder: "Search by email, ID, tenant, role or status",
      errorReadingTenantUsers: "Error reading tenant users",
      errorReadingTenants: "Error reading tenants",
    },

    adminTables: {
      emptyList: "There are no records.",
      errorReading: "Error reading {table}.",
      readOnlyNotice:
        "Read-only view. Changes will be handled later through controlled actions.",
      columns: {
        id: "ID",
        code: "Code",
        name: "Name",
        description: "Description",
        active: "Active",
        status: "Status",
        role: "Role",
        slug: "Slug",
        email: "Email",

        tenant_id: "Tenant ID",
        user_id: "User ID",
        product_id: "Product ID",
        plan_id: "Plan ID",
        subscription_id: "Subscription ID",

        created_at: "Created",
        updated_at: "Updated",
        starts_at: "Start",
        ends_at: "End",
        current_period_start: "Period start",
        current_period_end: "Period end",
        canceled_at: "Canceled",
        tenant: "Tenant",
        plan: "Plan",
        product: "Product",
        user: "User",
      },
    },

    supplierUpload: {
      title: "Supplier document upload",
      company: "Company",
      supplierTaxId: "Supplier tax ID",
      invoiceNo: "Document no.",
      invoiceDate: "Document date",
      linesTitle: "Document lines",
      quantity: "Qty.",
      unitPrice: "Price",
      discountAmount: "Disc. Amount",
      baseAmount: "Base",
      vatRate: "VAT %",
      equivalenceSurchargeRate: "Eq. surcharge %",
      withholdingRate: "Withholding %",
      totalInvoice: "Document total",
      addLine: "Add line",
      removeLine: "Remove",
      file: "Attachment",
      confirmationEmailField: "Confirmation email",
      confirmationEmailHelp:
        "It is filled automatically if the supplier has an email address, but you can edit it or leave it empty.",
      loadingConfirmationEmail: "Looking up supplier email...",
      submit: "Submit document",
      submitting: "Submitting...",
      successTitle: "Document submitted",
      successDescription:
        "The document has been received successfully. We have sent a confirmation email.",
      errorTitle: "Could not send the document",

      confirmationEmail: {
        subject: "Document upload confirmation {invoiceNo}",
        title: "Document received successfully",
        intro: "We have received the document submitted through the supplier portal.",
        pendingReview: "The invoice is pending internal review.",
        invoiceData: "Document details",
        company: "Company",
        supplierTaxId: "Supplier tax ID",
        invoiceNo: "Document no.",
        invoiceDate: "Document date",
        lineCount: "No. of lines",
        baseTotal: "Total base amount",
        invoiceTotal: "Invoice total",
        footer:
          "This message only confirms receipt of the invoice. Final validation is pending internal review.",
      },

      errors: {
        invalidLines: "The invoice lines are not valid.",
        invalidBaseAmount: "The base amount on line {lineNumber} is not valid.",
        invalidVatRate: "The VAT % on line {lineNumber} is not valid. If it has no VAT, enter 0%",
        invalidEquivalenceSurchargeRate:
          "The equivalence surcharge % on line {lineNumber} is not valid.",
        invalidWithholdingRate:
          "The withholding % on line {lineNumber} is not valid.",
        invalidUploadLink: "The upload link is not valid.",
        unavailableUploadLink: "The upload link is not available.",
        supplierTaxIdRequired: "Supplier tax ID is required.",
        invalidDocumentType: "Document type is not valid.",
        invoiceNoRequired: "Document number is required.",
        invoiceDateRequired: "Document date is required.",
        invalidInvoiceDate: "Document date is not valid.",
        confirmationEmailRequired: "Confirmation email is required.",
        invalidConfirmationEmail: "Confirmation email is not valid.",
        linesRequired: "You must enter at least one line.",
        fileRequired: "You must attach a file.",
        emptyFile: "The attached file is empty.",
        maxFileSize: "The file cannot exceed 10 MB.",
        invalidFileType: "The file must be PDF, XML, JPG or PNG.",
        unsupportedStorage:
          "Portal uploads are currently only available with Supabase Storage.",
        supplierValidation: "The supplier could not be validated.",
        supplierNotFound:
          "No supplier with that tax ID was found for this company.",
        supplierWithoutEmail:
          "The matched supplier does not have an email address on its card.",
        invoiceCreateError: "The invoice could not be created.",
        linesCreateError: "The lines could not be created.",
        fileUploadError: "The file could not be uploaded.",
        fileRecordError: "The file record could not be created.",
      },
    },
    fieldVisibilityPreferences: {
      title: "Field personalization",
      description:
        "Configure which fields are shown by entity, area and user.",
      entity: "Entity",
      area: "Area",
      applyTo: "Apply to",
      allUsers: "All users",
      currentUser: "Only my user",
      fields: "Fields",
      visible: "Visible",
      save: "Save",
      saving: "Saving...",
      saved: "Preferences saved.",
      saveError: "Error saving",
      showAll: "Show all",
      hideAll: "Hide all",
      noFields: "There are no configurable fields.",

      list: "List",
      form: "Card",
      grid: "Lines",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionaryByLocale(locale: Locale): Dictionary {
  return dictionaries[locale];
}
