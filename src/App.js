import React from "react";

import "./App.css";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TablePagination from "@mui/material/TablePagination";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useCSVReader } from "react-papaparse";

import TablePaginationActions from "./actions";

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div className="flex justify-center">
      <input
        {...props}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border-1 px-2"
      />
    </div>
  );
}

function Filter({ column, table }) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue();

  const sortedUniqueValues = React.useMemo(
    () =>
      typeof firstValue === "number"
        ? []
        : Array.from(column.getFacetedUniqueValues().keys()).sort(),
    [column.getFacetedUniqueValues()]
  );

  return typeof firstValue === "number" ? (
    <div>
      <div className="flex space-x-2">
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={columnFilterValue?.[0] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old) => [value, old?.[1]])
          }
          placeholder={`Min ${
            column.getFacetedMinMaxValues()?.[0]
              ? `(${column.getFacetedMinMaxValues()?.[0]})`
              : ""
          }`}
          className="w-24 border shadow rounded"
        />
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={columnFilterValue?.[1] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old) => [old?.[0], value])
          }
          placeholder={`Max ${
            column.getFacetedMinMaxValues()?.[1]
              ? `(${column.getFacetedMinMaxValues()?.[1]})`
              : ""
          }`}
          className="w-24 border shadow rounded"
        />
      </div>
      <div className="h-1" />
    </div>
  ) : (
    <>
      <datalist id={column.id + "list"}>
        {sortedUniqueValues.slice(0, 5000).map((value, i) => (
          <option value={value} key={value + i} />
        ))}
      </datalist>
      <DebouncedInput
        type="text"
        value={columnFilterValue ?? ""}
        onChange={(value) => column.setFilterValue(value)}
        placeholder={`Search... (${column.getFacetedUniqueValues().size})`}
        className="w-36 border shadow rounded"
        list={column.id + "list"}
      />
      <div className="h-1" />
    </>
  );
}

function IndeterminateCheckbox({ indeterminate, className = "", ...rest }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + " cursor-pointer"}
      {...rest}
    />
  );
}

function App() {
  const rerender = React.useReducer(() => ({}), {})[1];
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [tableData, setTableData] = React.useState([]);

  const { CSVReader } = useCSVReader();

  const columns = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <IndeterminateCheckbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler(),
            }}
          />
        ),
        cell: ({ row }) => (
          <div className="px-1 text-center flex items-center justify-center">
            <IndeterminateCheckbox
              {...{
                checked: row.getIsSelected(),
                disabled: !row.getCanSelect(),
                indeterminate: row.getIsSomeSelected(),
                onChange: row.getToggleSelectedHandler(),
              }}
            />
          </div>
        ),
      },
      {
        accessorKey: "extID",
        header: () => <span>Ext id</span>,
        cell: (info) => (
          <span className="text-center t-cell">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: "class",
        header: () => <span>Class</span>,
        cell: (info) => (
          <span className="text-center t-cell">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: "fullname",
        header: () => <span>Full name</span>,
      },
      {
        accessorKey: "group",
        header: () => <span>Group</span>,
        cell: (info) => (
          <span className="text-center t-cell">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: "group-2",
        header: () => <span>Group 2</span>,
        cell: (info) => (
          <span className="text-center t-cell">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: "status",
        header: () => <span>Status</span>,
        cell: (info) => (
          <span className="text-center t-cell">{info.getValue()}</span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      columnFilters,
      globalFilter,
      rowSelection,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
  });

  const { pageSize, pageIndex } = table.getState().pagination;

  React.useEffect(() => {
    if (table.getState().columnFilters[0]?.id === "fullName") {
      if (table.getState().sorting[0]?.id !== "fullName") {
        table.setSorting([{ id: "fullName", desc: false }]);
      }
    }
  }, [table.getState().columnFilters[0]?.id]);

  return (
    <div className="container">
      <div className="p-2">
        <div className="flex gap-2 items-center text-xl md:text-2xl text-center justify-center">
          <span className="font-light">TanStack</span>
          <div className="font-bold">
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">
              Table
            </span>
            <span className="text-sm align-super">v8</span>
          </div>
        </div>
        <div>
          <CSVReader
            onUploadAccepted={(results) => {
              const notFirstData = results.data.filter((_, i) => i !== 0);

              const header = results.data[0];

              const tempData = notFirstData.map((data) => {
                const categoryPosts = data.reduce((acc, post, i) => {
                  return { ...acc, [header[i]]: post };
                }, {});

                return categoryPosts;
              });

              setTableData(tempData);
            }}
          >
            {({ getRootProps, acceptedFile }) => (
              <div style={{ position: "relative" }}>
                <div className="btn-container">
                  <button type="button" {...getRootProps()} className="button">
                    Browse file
                  </button>
                  <div>{acceptedFile && acceptedFile.name}</div>
                </div>
                <span
                  style={{
                    background: "#000",
                    height: "2px",
                    width: "100%",
                    display: "block",
                    marginTop: "5px",
                    marginBottom: "5px",
                  }}
                />
              </div>
            )}
          </CSVReader>
        </div>
        {tableData.length ? (
          <>
            <div>
              <DebouncedInput
                value={globalFilter ?? ""}
                onChange={(value) => setGlobalFilter(String(value))}
                className="p-2 font-lg shadow border border-block"
                placeholder="Search all columns..."
              />
            </div>
            <div className="h-2" />
            <Box sx={{ width: "100%" }}>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableCell key={header.id} colSpan={header.colSpan}>
                              {header.isPlaceholder ? null : (
                                <>
                                  <div
                                    {...{
                                      className: header.column.getCanSort()
                                        ? "cursor-pointer select-none"
                                        : "",
                                      onClick:
                                        header.column.getToggleSortingHandler(),
                                    }}
                                  >
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                    {{
                                      asc: " 🔼",
                                      desc: " 🔽",
                                    }[header.column.getIsSorted()] ?? null}
                                  </div>
                                  {header.column.getCanFilter() ? (
                                    <div>
                                      <Filter
                                        column={header.column}
                                        table={table}
                                      />
                                    </div>
                                  ) : null}
                                </>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHead>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => {
                      return (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => {
                            return (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <tfoot>
                    <tr>
                      <td className="p-1 text-center">
                        <IndeterminateCheckbox
                          {...{
                            checked: table.getIsAllPageRowsSelected(),
                            indeterminate: table.getIsSomePageRowsSelected(),
                            onChange:
                              table.getToggleAllPageRowsSelectedHandler(),
                          }}
                        />
                      </td>
                      <td colSpan={20}>
                        Page Rows ({table.getRowModel().rows.length})
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[
                  5,
                  10,
                  25,
                  { label: "All", value: tableData.length },
                ]}
                component="div"
                count={table.getFilteredRowModel().rows.length}
                rowsPerPage={pageSize}
                page={pageIndex}
                SelectProps={{
                  inputProps: { "aria-label": "rows per page" },
                  native: true,
                }}
                onPageChange={(_, page) => {
                  table.setPageIndex(page);
                }}
                onRowsPerPageChange={(e) => {
                  const size = e.target.value ? Number(e.target.value) : 10;
                  table.setPageSize(size);
                }}
                ActionsComponent={TablePaginationActions}
              />
            </Box>
            <div>{table.getPrePaginationRowModel().rows.length} Rows</div>
            <div>
              <button onClick={() => rerender()}>Force Rerender</button>
            </div>
            <pre>{JSON.stringify(table.getState(), null, 2)}</pre>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default App;
