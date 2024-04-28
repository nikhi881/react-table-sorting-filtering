import { useState, useEffect } from "react";
import "./styles.css";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";

// ENUMS Implementation
// Enums are used to represent a fixed set of named values.
// However, Enums are not native to JavaScript,
// so they are usually implemented using objects or frozen arrays.
const sortDirection = Object.freeze({
  ASCENDING: "ASCENDING",
  DESCENDING: "DESCENDING",
  UNSORTED: "UNSORTED",
});

// Material UI Table styling properties
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

// Material UI Table styling properties
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

// Used fetch()
// Fetches the data from the api
const fetchUsersData = async () => {
  return await fetch("https://randomuser.me/api/?results=20")
    .then((response) => response.json())
    .then((data) => {
      return data.results;
    })
    .catch((error) => console.error(error));
};

const flattenLocations = (locations) => {
  const data = [];
  // destructuring and rest operator
  for (const { street, coordinates, timezone, ...rest } of locations) {
    data.push({
      ...rest,
      number: street.number,
      name: street.name,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      offset: timezone.offset,
      description: timezone.description,
    });
  }
  const flattenedLocationHeaders = extractObjectKeys(data[0]);
  return { headers: flattenedLocationHeaders, data };
};

const extractObjectKeys = (object) => {
  let objectKeys = [];
  // object.keys() to ectract array of keys from an object
  Object.keys(object || {}).forEach((objectKey) => {
    const value = object[objectKey];
    if (typeof value !== "object") {
      objectKeys.push(objectKey);
    } else {
      //spread operator
      objectKeys = [...objectKeys, ...extractObjectKeys(value)];
    }
  });

  return objectKeys;
};

// sorting algorithm
const sortData = (data, sortKey, sortingDirection) => {
  data.sort((a, b) => {
    const relevantValueA = a[sortKey];
    const relevantValueB = b[sortKey];

    if (
      sortingDirection === sortDirection.UNSORTED ||
      sortingDirection === sortDirection.ASCENDING
    ) {
      if (relevantValueA < relevantValueB) return -1;
      if (relevantValueA > relevantValueB) return 1;
      return 0;
    } else {
      if (relevantValueA > relevantValueB) return -1;
      if (relevantValueA < relevantValueB) return 1;
      return 0;
    }
  });
};

const getNextSortDirection = (sortingDirection) => {
  if (
    sortingDirection === sortDirection.UNSORTED ||
    sortingDirection === sortDirection.ASCENDING
  ) {
    return sortDirection.DESCENDING;
  }
  return sortDirection.ASCENDING;
};

// filter data
const getFilteredRows = (rows, filterKey) => {
  return rows.filter((row) => {
    return Object.values(row).some((s) =>
      s.toString().toLowerCase().includes(filterKey)
    );
  });
};

export default function App() {
  const [users, setusers] = useState([]);
  const [flatLocations, setFlatLocations] = useState({
    headers: [],
    data: [],
  });
  const [sortDirections, setSortDirections] = useState({});
  const [inputFieldValue, setInputFieldValue] = useState("");

  const sortColumn = (sortKey) => {
    const newFlattenedLocations = {
      ...flatLocations,
      data: [...flatLocations.data],
    };

    const currentSortDirection = sortDirections[sortKey];

    sortData(newFlattenedLocations.data, sortKey, currentSortDirection);
    const nextSortingDirection = getNextSortDirection(currentSortDirection);

    const newSortingDirections = { ...sortDirections };
    newSortingDirections[sortKey] = nextSortingDirection;

    setFlatLocations(newFlattenedLocations);
    setSortDirections(newSortingDirections);
  };

  useEffect(() => {
    fetchUsersData().then((apiData) => {
      setusers(apiData);
    });
    const flatLocationsData = flattenLocations(
      users.map(({ location }) => {
        return location;
      })
    );
    setFlatLocations(flatLocationsData);

    const { headers } = flatLocationsData;
    const ourSortingDirections = {};
    for (const header of headers) {
      ourSortingDirections[header] = sortDirection.UNSORTED;
    }

    setSortDirections(ourSortingDirections);
  }, []);

  return (
    <div className="App">
      <h1>Table sorting and filtering</h1>
      <TextField
        id="outlined-basic"
        label="Search"
        variant="outlined"
        value={inputFieldValue}
        onChange={(e) => {
          setInputFieldValue(e.target.value);
        }}
        className="m-4"
      />

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableHead>
            <TableRow>
              {flatLocations.headers.map((headerData, headerIdx) => {
                return (
                  <StyledTableCell
                    key={headerIdx}
                    onClick={() => sortColumn(headerData)}
                  >
                    {headerData}
                  </StyledTableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {getFilteredRows(flatLocations.data, inputFieldValue).length ? (
              getFilteredRows(flatLocations.data, inputFieldValue).map(
                (locationData, locationIdx) => (
                  <StyledTableRow
                    key={locationIdx}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    {flatLocations.headers.map((header, headerIdx) => (
                      <StyledTableCell key={`${headerIdx}${locationIdx}`}>
                        {locationData[header]}
                      </StyledTableCell>
                    ))}
                  </StyledTableRow>
                )
              )
            ) : (
              <StyledTableRow
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <StyledTableCell colSpan="10">No matching data</StyledTableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
