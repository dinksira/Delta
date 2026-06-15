enum MtColumnType {
  text,
  textarea,
  number,
  date,
  checkbox,
  dropdown,
  status,
  link,
  phone;

  static MtColumnType fromApi(String raw) {
    switch (raw.trim()) {
      case 'textarea':
        return MtColumnType.textarea;
      case 'number':
        return MtColumnType.number;
      case 'date':
        return MtColumnType.date;
      case 'checkbox':
        return MtColumnType.checkbox;
      case 'dropdown':
        return MtColumnType.dropdown;
      case 'status':
        return MtColumnType.status;
      case 'link':
        return MtColumnType.link;
      case 'phone':
        return MtColumnType.phone;
      default:
        return MtColumnType.text;
    }
  }

  String get apiValue => name;
}
