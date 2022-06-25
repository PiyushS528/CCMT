var inputfield = {
	year: document.getElementById("ccmt_year"),
	round: document.getElementById("ccmt_round"),
	score: document.getElementById("gate_score"),
	category: document.getElementById("category"),
	showcourses: document.getElementById("table_view"),
	sortby: document.getElementById("sort_by"),
	showAllCategories: document.getElementById("show_all_categories"),
	orderasc: document.getElementById("order_asc"),
	rowsperpage: document.getElementById("rowsperpage")
};
var state = {
	year: 0,
	round: "",
	score: 0,
	category: 0,
	showcourses: 0,
	sortby: 0,

	categorymask: 0,

	rowsperpage: 0,
	currpage: 0,

	tabledata: [],
	othertabledata: []
};
function updateInputState() {
	state.year = inputfield.year.value;
	state.round = inputfield.round.value;
	state.score = parseInt(inputfield.score.value);
	if (!state.score) state.score = 0;

	state.category = parseInt(inputfield.category.value);
	state.showcourses = parseInt(inputfield.showcourses.value);
	state.sortby = parseInt(inputfield.sortby.value);
	if (!inputfield.orderasc.checked) ++state.sortby;

	if (inputfield.showAllCategories.checked) state.categorymask = 1023;
	else state.categorymask = Math.pow(2, state.category);

	state.rowsperpage = parseInt(inputfield.rowsperpage.value);
	state.currpage = 0;

	state.tabledata = [];
	state.othertabledata = [];
}
function scrollToTop() {
	document.getElementById("course_counter").scrollIntoView();
	document.getElementById("next_page").focus();
}
function highlightUpdateButton (disable) {
	if (disable)
		document.getElementById("update").style.outline = "0";
	else
		document.getElementById("update").style.outline = "3px solid #df5f5f";
}
function addCell (tr, str, classList) {		// append <td class=(classList)>(str)</td> in tr table row
	var td = document.createElement("td");
	var text = document.createTextNode (str);
	if (classList) td.className += " "+classList;
	td.appendChild(text);
	tr.appendChild(td);
	return td;
}
function addHeader (tr, str, classList) {		// append <th class=(classList)>(str)</th> in tr table row
	var th = document.createElement("th");
	var text = document.createTextNode (str);
	if (classList) th.className += " "+classList;
	th.appendChild(text);
	tr.appendChild(th);
	return th;
}
function addTableHeader (table) {
	var tr, th;

	var tr = document.createElement ("tr");

	th = addHeader(tr, "Sr. No."); th.setAttribute("rowspan", 2);
	th = addHeader(tr, "Institute Name"); th.setAttribute("rowspan", 2);
	th = addHeader(tr, "Program Name"); th.setAttribute("rowspan", 2);
	th = addHeader(tr, "Group Id"); th.setAttribute("rowspan", 2);

	
	if (state.categorymask & 1) {th = addHeader(tr, "GEN"); th.setAttribute("colspan", 2);}
	if (state.categorymask & 2) {th = addHeader(tr, "GEN-PwD"); th.setAttribute("colspan", 2);}
	if (state.categorymask & 4) {th = addHeader(tr, "EWS"); th.setAttribute("colspan", 2);}
	if (state.categorymask & 8) {th = addHeader(tr, "EWS-PwD"); th.setAttribute("colspan", 2);}
	if (state.categorymask & 16) {th = addHeader(tr, "OBC-NCL"); th.setAttribute("colspan", 2);}
	if (state.categorymask & 32) {th = addHeader(tr, "OBC-NCL-PwD"); th.setAttribute("colspan", 2);}
	if (state.categorymask & 64) {th = addHeader(tr, "SC"); th.setAttribute("colspan", 2);}
	if (state.categorymask & 128) {th = addHeader(tr, "SC-PwD"); th.setAttribute("colspan", 2);}
	if (state.categorymask & 256) {th = addHeader(tr, "ST"); th.setAttribute("colspan", 2);}
	if (state.categorymask & 512) {th = addHeader(tr, "ST-PwD"); th.setAttribute("colspan", 2);}
	table.appendChild(tr);

	var tr = document.createElement ("tr");

	for (var i = 1; i <= 512 ; i *= 2) {
		if (state.categorymask & i) {
			addHeader(tr, "MAX");
			addHeader(tr, "MIN");
		}
	}
	table.appendChild(tr);
}
function insSort(d, cmp) {		// insertion sort with cmp() as comparing function
	for (var i = 1; i < d.length; ++i) {
		for (var j = i; j > 0; --j) {
			if (cmp(d[j-1], d[j]) > 0) {
				var temp = d[j];
				d[j] = d[j-1];
				d[j-1] = temp;
			}
			else break;
		}
	}
}
function sortData(data, sortType, scoreindex) {		// scoreindex = starting index of score within data row (general category)
	switch (sortType) {
		case 0: insSort(data, function (a, b) {return (a[0] <= b[0]) ? -1 : 1});	// Ascending institute name
			break;
		case 1: insSort(data, function (a, b) {return (b[0] <= a[0]) ? -1 : 1});	// Descending institute name
			break;
		case 2: insSort(data, function (a, b) {return (a[1] <= b[1]) ? -1 : 1});	// Ascending program name
			break;
		case 3: insSort(data, function (a, b) {return (b[1] <= a[1]) ? -1 : 1});	// Descending program name
			break;
		case 4: insSort(data, function (a, b) {return a[scoreindex] - b[scoreindex]});	// Ascending MAX score
			break;
		case 5: insSort(data, function (a, b) {return b[scoreindex] - a[scoreindex]});	// Descending MAX score
			break;
		case 6: insSort(data, function (a, b) {return a[scoreindex+1] - b[scoreindex+1]});	// Ascending MIN score
			break;
		case 7: insSort(data, function (a, b) {return b[scoreindex+1] - a[scoreindex+1]});	// Descending MIN score
			break;
		case 8: insSort(data, function (a, b) {return (a[scoreindex]+a[scoreindex+1])/2 - (b[scoreindex+1]+b[scoreindex])/2});	// Ascending (MAX+MIN)/2 (average)
			break;
		case 9: insSort(data, function (a, b) {return (b[scoreindex]+b[scoreindex+1])/2 - (a[scoreindex+1]+a[scoreindex])/2});	// Descending (MAX+MIN)/2 (average)
			break;
	}
	return data;
}
function displayTableRows (startingrow, totalrows) {		// Take data from state.tabledata & data.othertabledata and display the specified range of rows.
	var table = document.getElementById ("cutoff_table");

	while (table.firstChild)
		table.removeChild (table.lastChild);	// clears the table
	addTableHeader(table);

	var lastrow = startingrow + totalrows - 1;
	if ((lastrow > state.tabledata.length - 1) || (totalrows === 0))
		lastrow = state.tabledata.length - 1;

	for (var i = startingrow; i <= lastrow; ++i) {
		var row = document.createElement("tr");
		row.className += state.othertabledata[i][0];
		addCell(row, state.tabledata[i][0]);		// Sr. No.
		addCell(row, state.tabledata[i][1]);		// Institute Name
		addCell(row, state.tabledata[i][2]);		// Program Name
		addCell(row, state.tabledata[i][3], "default");		// Group ID

		var categoryBit = 1;
		for (var j = 4; j < state.tabledata[i].length; ++j) {
			if (state.categorymask & categoryBit) {
				var colorcode = state.othertabledata[i][j-3];
				var cellclass;
				switch (colorcode) {
					case 0: cellclass = "default"; break;
					case 1: cellclass = "good"; break;
					case 2: cellclass = "bad"; break;
					case 3: cellclass = "grey"; break;
				}
				addCell(row, state.tabledata[i][j], cellclass);
			}
			if (j & 1) categoryBit *= 2;
		}
		table.appendChild (row);
	}
	document.getElementById ("rowsrange").innerHTML = ((state.tabledata.length === 0) ? "0-" : (startingrow + 1) + "-");
	document.getElementById ("rowsrange").innerHTML += (lastrow + 1) + " out of " +  state.tabledata.length;
}
function updatePage (index) {
	// -2: previous page;
	// -1: next page;
	// 0,1,2,... : page 0,1,2,....
	// NaN: Just refresh the page

	if (!isNaN(index)) {
		state.rowsperpage = parseInt(inputfield.rowsperpage.value);
		var totalPages = ((state.rowsperpage === 0) ? 1 : Math.ceil(state.tabledata.length / state.rowsperpage));
		if (totalPages === 0) totalPages = 1;

		if (index === -2) {
			if (state.currpage > 0) --state.currpage;
			else return;
		}
		else if (index === -1) {
			if (state.currpage < totalPages-1) ++state.currpage;
			else return;
		}
		else if (index < -2) return;
		else state.currpage = index;

		if (state.currpage === 0)
			document.getElementById("prev_page").setAttribute("disabled", "disabled");
		else
			document.getElementById("prev_page").removeAttribute("disabled");
		if (state.currpage === totalPages-1)
			document.getElementById("next_page").setAttribute("disabled", "disabled");
		else
			document.getElementById("next_page").removeAttribute("disabled");

		var pageNumbers = document.getElementById ("page_number_row");
		while (pageNumbers.firstChild)
			pageNumbers.removeChild (pageNumbers.lastChild);	// clears all page number buttons

		for (var i = 0; i < totalPages; ++i) {
			var li = document.createElement ("li");
			var link = document.createElement ("button");
			link.setAttribute("onclick", "updatePage(" + i + ")");
			link.setAttribute("aria-label", "Go to page " + (i+1) + " of " + totalPages);
			link.className = "page_number";
			link.innerHTML = i+1;
			if (state.currpage === i) {
				link.setAttribute ("disabled", "disabled");
				document.getElementById("prev_page").setAttribute("aria-label", "Previous page button, currently at " + (i+1) + " of " + totalPages);
				document.getElementById("next_page").setAttribute("aria-label", "Next page button, currently at " + (i+1) + " of " + totalPages);
			}
			li.appendChild (link);
			pageNumbers.appendChild (li);
		}
	}
	displayTableRows(state.currpage * state.rowsperpage, state.rowsperpage);
}
function parseTable() {
	highlightUpdateButton(true);
	updateInputState();
	var categoryOffset = 2 * state.category;

	var data = scores[inputfield.year.value][inputfield.round.value];
	data = sortData(data, state.sortby, categoryOffset+3);

	var goodCount = 0, zeroCount = 0, totalCount = 0;

	for (var i = 0; i < data.length; ++i) {
		var s = data[i];
		var scoreCellNumber = 0;
		var row = [], classesData = [];
		row.push(i+1);

		for (var j = 0; j < s.length; ++j) {
			if (j <= 2)
				row.push(s[j]);
			else if (j > 2) {
				if (scoreCellNumber === categoryOffset || scoreCellNumber === categoryOffset+1) {
					if (s[j] === 0) {
						if (scoreCellNumber === categoryOffset) {
							classesData.unshift(" grey");
							++zeroCount;
						}
						if (state.showcourses >= 2) {
							row = null;
							break;
						}
						row.push(s[j]);
						classesData.push(3);
					}
					else if (state.score >= s[j]) {
						if (scoreCellNumber === categoryOffset+1) {
							classesData.unshift(" good");
							++goodCount;
						}
						row.push(s[j]);
						classesData.push(1);
					}
					else if (state.score < s[j]) {
						if (scoreCellNumber === categoryOffset+1) {
							classesData.unshift(" bad");
							if (state.showcourses >= 1) {
								row = null;
								break;
							}
						}
						row.push(s[j]);
						classesData.push(2);
					}
				}
				else {
					row.push(s[j]);
					classesData.push(0);
				}

				++scoreCellNumber;
			}
			if (j === s.length - 1) {
				++totalCount;
				state.tabledata.push(row);
				state.othertabledata.push(classesData);
			}
		}
	}
	updatePage(0);

	document.getElementById("totalCount").innerHTML = i;
	document.getElementById("goodCount").innerHTML = goodCount;
	document.getElementById("badCount").innerHTML = i - goodCount - zeroCount;
	document.getElementById("zeroCount").innerHTML = zeroCount;

	document.getElementById("curr_year").innerHTML = inputfield.year.children[inputfield.year.selectedIndex].innerHTML;
	document.getElementById("curr_round").innerHTML = inputfield.round.children[inputfield.round.selectedIndex].innerHTML;
	document.getElementById("curr_score").innerHTML = state.score;
	document.getElementById("curr_cat").innerHTML = inputfield.category.children[inputfield.category.selectedIndex].innerHTML;
	document.getElementById("curr_view").innerHTML = inputfield.showcourses.children[inputfield.showcourses.selectedIndex].innerHTML;
	document.getElementById("curr_sort").innerHTML = inputfield.sortby.children[inputfield.sortby.selectedIndex].innerHTML;
	document.getElementById("curr_order").innerHTML = (inputfield.orderasc.checked ? "Ascending" : "Descending");
}
function yearChanged() {		// Update 'round' selection box if 'year' selection is changed
	inputfield.round.innerHTML = "";
	for (var r in scores[inputfield.year.value]) {
		var option = document.createElement("option");
		option.setAttribute("value", r);
		var text = document.createTextNode(r);
		option.appendChild(text);
		inputfield.round.appendChild(option);
	}
	highlightUpdateButton();
}
function categoryViewChanged() {
	if (inputfield.showAllCategories.checked) state.categorymask = 1023;
	else state.categorymask = Math.pow(2, state.category);

	updatePage();
}
function loadInitTable() {		// Group by institute name, sort by program name for every list
	for (var year in scores) {
		for (var round in scores[year]) {
			sortData(scores[year][round], 2);
			sortData(scores[year][round], 0);
		}
	}
	parseTable();
}
