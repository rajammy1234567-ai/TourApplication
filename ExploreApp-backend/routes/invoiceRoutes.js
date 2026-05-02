const router = require("express").Router();
const { downloadInvoice } = require("../controllers/invoiceController");

router.get("/:id", downloadInvoice);

module.exports = router;