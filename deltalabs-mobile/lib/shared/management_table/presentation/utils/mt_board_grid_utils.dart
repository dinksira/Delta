import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_type.dart';
import 'package:flutter/material.dart';

double mtMinWidthForColumn(MtColumnModel column) {
  switch (column.type) {
    case MtColumnType.checkbox:
      return 72;
    case MtColumnType.date:
      return 120;
    case MtColumnType.number:
      return 96;
    case MtColumnType.status:
      return 128;
    case MtColumnType.textarea:
      return 200;
    default:
      return 140;
  }
}

TextAlign mtAlignForColumn(MtColumnModel column) {
  switch (column.type) {
    case MtColumnType.checkbox:
    case MtColumnType.number:
      return TextAlign.center;
    default:
      return TextAlign.left;
  }
}
