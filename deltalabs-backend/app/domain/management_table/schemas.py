"""Pydantic models for management table definitions, instances, and rows."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Mapping

from pydantic import BaseModel, ConfigDict, Field

MANAGEMENT_TABLE_DEFAULT_GROUP_ID = "mtg_main"

# One workspace item (e.g. class) can host several specialized tables — each kind is isolated.
MANAGEMENT_TABLE_KIND_MANAGEMENT = "management"
MANAGEMENT_TABLE_KIND_STUDENTS = "students"
MANAGEMENT_TABLE_KIND_PARENTS = "parents"
MANAGEMENT_TABLE_KIND_TEACHERS = "teachers"
MANAGEMENT_TABLE_KIND_LEAVE_REQUESTS = "leave_requests"
MANAGEMENT_TABLE_KIND_GRADES = "grades"
MANAGEMENT_TABLE_KIND_SCHEDULES = "schedules"
MANAGEMENT_TABLE_KIND_ASSIGNMENTS = "assignments"

ManagementTableVisibility = Literal["self_owned", "sharable"]
ManagementTableDefinitionListScope = Literal["all", "template", "mine"]
ManagementTableColumnType = Literal[
    "text",
    "textarea",
    "number",
    "date",
    "checkbox",
    "dropdown",
    "status",
    "link",
    "phone",
]


class ManagementTableColumnPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    type: ManagementTableColumnType
    order: int = 0
    settings: dict[str, Any] = Field(default_factory=dict)


class ManagementTableDefinitionCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    visibility: ManagementTableVisibility = "self_owned"


class ManagementTableDefinitionUpdateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    visibility: ManagementTableVisibility | None = None


class ManagementTableColumnAppendInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(default="New column", min_length=1, max_length=200)
    type: ManagementTableColumnType = "text"
    settings: dict[str, Any] = Field(default_factory=dict)


class ManagementTableColumnPatchInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)


class ManagementTableDefinitionInheritInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    visibility: ManagementTableVisibility = "self_owned"


class ManagementTableDefinitionPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    title: str
    visibility: ManagementTableVisibility
    source_definition_id: str | None = Field(default=None, serialization_alias="sourceDefinitionId")
    version: int = 1
    columns: list[ManagementTableColumnPublic]
    created_by_user_id: str = Field(serialization_alias="createdByUserId")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class ManagementTableDefinitionListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[ManagementTableDefinitionPublic]


class ManagementTableInstanceCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    definition_id: str = Field(alias="definitionId", min_length=1)
    title: str | None = Field(default=None, min_length=1, max_length=200)
    workspace_item_id: str | None = Field(default=None, alias="workspaceItemId")
    table_kind: str | None = Field(default=None, alias="tableKind", max_length=64)


class ManagementTableGroupPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    order: int = 0


class ManagementTableTableGroupCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)


class ManagementTableInstancePublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    definition_id: str = Field(serialization_alias="definitionId")
    definition_version: int = Field(serialization_alias="definitionVersion")
    workspace_item_id: str | None = Field(default=None, serialization_alias="workspaceItemId")
    table_kind: str | None = Field(default=None, serialization_alias="tableKind")
    title: str
    table_groups: list[ManagementTableGroupPublic] = Field(serialization_alias="tableGroups")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class ManagementTableInstanceBundleResponse(BaseModel):
    """Instance metadata plus the column schema used by this instance (definition snapshot)."""

    model_config = ConfigDict(populate_by_name=True)

    instance: ManagementTableInstancePublic
    definition: ManagementTableDefinitionPublic


class ManagementTableRowPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    instance_id: str = Field(serialization_alias="instanceId")
    group_id: str | None = Field(default=None, serialization_alias="groupId")
    position: int
    cells: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class ManagementTableRowListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[ManagementTableRowPublic]
    total: int


class ManagementTableRowCellsPatchInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    cells: dict[str, Any] = Field(default_factory=dict)


class ManagementTableWorkspaceBootstrapResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    instance: ManagementTableInstancePublic
    definition: ManagementTableDefinitionPublic
    already_linked: bool = Field(serialization_alias="alreadyLinked")


def map_column(doc: Mapping[str, Any]) -> ManagementTableColumnPublic:
    return ManagementTableColumnPublic(
        id=str(doc["id"]),
        title=str(doc.get("title", "")),
        type=str(doc.get("type", "text")),  # type: ignore[arg-type]
        order=int(doc.get("order", 0)),
        settings=dict(doc["settings"]) if isinstance(doc.get("settings"), dict) else {},
    )


def map_definition(doc: Mapping[str, Any]) -> ManagementTableDefinitionPublic:
    raw_cols = doc.get("columns")
    columns: list[ManagementTableColumnPublic] = []
    if isinstance(raw_cols, list):
        for c in raw_cols:
            if isinstance(c, dict):
                columns.append(map_column(c))
    columns.sort(key=lambda c: c.order)
    return ManagementTableDefinitionPublic(
        id=str(doc["_id"]),
        org_id=str(doc["org_id"]),
        school_id=str(doc["school_id"]),
        title=str(doc.get("title", "")),
        visibility=str(doc.get("visibility", "self_owned")),  # type: ignore[arg-type]
        source_definition_id=str(doc["source_definition_id"]) if doc.get("source_definition_id") else None,
        version=int(doc.get("version", 1)),
        columns=columns,
        created_by_user_id=str(doc.get("created_by_user_id", "")),
        created_at=doc["created_at"],  # type: ignore[arg-type]
        updated_at=doc["updated_at"],  # type: ignore[arg-type]
    )


def map_table_groups(doc: Mapping[str, Any]) -> list[ManagementTableGroupPublic]:
    raw = doc.get("table_groups")
    groups: list[ManagementTableGroupPublic] = []
    if isinstance(raw, list):
        for i, g in enumerate(raw):
            if isinstance(g, dict) and g.get("id"):
                groups.append(
                    ManagementTableGroupPublic(
                        id=str(g["id"]),
                        title=str(g.get("title", "Table")),
                        order=int(g.get("order", i)),
                    ),
                )
    if not groups:
        groups.append(
            ManagementTableGroupPublic(id=MANAGEMENT_TABLE_DEFAULT_GROUP_ID, title="Main Table", order=0),
        )
    return sorted(groups, key=lambda x: x.order)


def map_instance(doc: Mapping[str, Any]) -> ManagementTableInstancePublic:
    return ManagementTableInstancePublic(
        id=str(doc["_id"]),
        org_id=str(doc["org_id"]),
        school_id=str(doc["school_id"]),
        definition_id=str(doc["definition_id"]),
        definition_version=int(doc.get("definition_version", 1)),
        workspace_item_id=str(doc["workspace_item_id"]) if doc.get("workspace_item_id") else None,
        table_kind=str(doc["table_kind"]) if doc.get("table_kind") else None,
        title=str(doc.get("title", "")),
        table_groups=map_table_groups(doc),
        created_at=doc["created_at"],  # type: ignore[arg-type]
        updated_at=doc["updated_at"],  # type: ignore[arg-type]
    )


def map_row(doc: Mapping[str, Any]) -> ManagementTableRowPublic:
    cells = doc.get("cells")
    raw_gid = doc.get("group_id")
    gid = str(raw_gid) if isinstance(raw_gid, str) and raw_gid.strip() else None
    return ManagementTableRowPublic(
        id=str(doc["_id"]),
        instance_id=str(doc["instance_id"]),
        group_id=gid,
        position=int(doc.get("position", 0)),
        cells=dict(cells) if isinstance(cells, dict) else {},
        created_at=doc["created_at"],  # type: ignore[arg-type]
        updated_at=doc["updated_at"],  # type: ignore[arg-type]
    )
