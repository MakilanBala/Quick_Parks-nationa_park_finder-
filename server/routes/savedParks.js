const express = require("express");
const { authMiddleware } = require("./auth");
const ctrl = require("../controllers/savedParksController");

const router = express.Router();
router.use(authMiddleware);

router.get("/", ctrl.list);
router.post("/", ctrl.save);
router.delete("/:key", ctrl.removeOne);
router.delete("/", ctrl.clear);

module.exports = router;