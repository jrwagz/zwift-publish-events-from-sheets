var googleSheetsTsvUrl = 'INSERT GOOGLE SHEETS PUBLISHED URL HERE';

$j(document).ready(function() {
	window.setTimeout(prepAllCats, 1000);
});

var sections = null;

function updateWorld(world)
{
	console.log('Updating world...');
	for (var ix = 0; ix < sections.length; ++ix) {
		var section = sections[ix];
		
		var select = $j(section).find(`select[name=mapId]`);

		var evnt = document.createEvent('HTMLEvents');
		evnt.initEvent('change', true, true);
		select[0].value = world;
		select[0].dispatchEvent(evnt);
	}
}

function updateCourse(course)
{
	console.log('Updating course...');
	var routes = $j(sections).find("div.route-select-area");
	
	for (var ix = 0; ix < routes.length; ++ix)
	{
		var route = routes[ix];

		var input = $j(route).find('input');
		var span = $j(input).next('span');

		var clickEvent = document.createEvent('HTMLEvents');
		clickEvent.initEvent('click', true, true);
		
		// open the menu
		span[0].dispatchEvent(clickEvent);

		var div = $j(route).find(`div.ml-2 > div:contains(${course})`);
		var parentDiv = $j(div).parent().parent().parent();

		// click the item
		parentDiv[0].dispatchEvent(clickEvent);
	}
}

function updateDurationType(durationType)
{
	console.log('Updating duration type...');
	
	for (var ix = 0; ix < sections.length; ++ix) {
		var section = sections[ix];

		var input = $j(section).find(`input[name=durationType][value=${durationType}]`);
		var evnt = document.createEvent('HTMLEvents');
		evnt.initEvent('click', true, true);
		input[0].checked = true;
		input[0].dispatchEvent(evnt);
	}
}

function updateDuration(durationType, distance, laps)
{
	console.log('Updating distance / laps...');
	if (durationType == 0) {
		// distance
		for (var ix = 0; ix < sections.length; ++ix) {
			var section = sections[ix];

			var input = $j(section).find("input[name=distanceInMeters]");
			var evnt = document.createEvent('HTMLEvents');
			evnt.initEvent('change', true, true);
			input[0].value = distance;
			input[0].dispatchEvent(evnt);
		}
	} else {
		// laps
		for (var ix = 0; ix < sections.length; ++ix) {
			var section = sections[ix];

			var input = $j(section).find("input[name=laps]");
			if (input.length == 0) {
				if (laps != 1) {
					window.alert(`Error, route only supports 1 lap, you have asked for ${laps} laps, if you need multiple laps for this course, use distance instead.`);
					return;
				}

				continue;
			}

			var evnt = document.createEvent('HTMLEvents');
			evnt.initEvent('change', true, true);
			input[0].value = laps;
			input[0].dispatchEvent(evnt);
		}
	}
}

function updateCategories(data)
{
	updateWorld(data.world);
	
	updateCourse(data.course);

	updateDurationType(data.distance != null ? 0 : 2);

	updateDuration(data.distance != null ? 0 : 2, data.distance, data.laps);

	console.log('Finished updates');

	var publishButton = $j("button.btn-primary:contains(Publish event)");

	publishButton.click();
}

function prepAllCats() {
	var buttons = $j("button:contains(Edit category)");

	if (buttons.length == 0) {
		// page is still loading...
		window.setTimeout(prepAllCats, 1000);

		return;
	}

	sections = $j("section.club-form-section").toArray();
	// first section is Event Info, drop it
	sections.shift();

	// hide the description so there's less to scroll through
	$j("label:contains(Event Description)").parent().attr('style', 'display:none');

	// expand all the categories
	for (var ix = 0; ix < buttons.length; ++ix) {
		buttons[ix].click();
	}

	var eventTitle = $j("span[data-testid=event-title]").text();
	var eventDateParts = $j("p[data-testid=event-date]").text().split('/');
	
	$j.ajax({
		url: googleSheetsTsvUrl,
		success: function(data, status, xhr) {
			fetchDataFromTsv(data, eventTitle, eventDateParts);
		},
		error: function (xhr, status, error) {
			window.alert('Failed to retrieve data from Google Sheets');
		}
	});

}

function fetchDataFromTsv(tsv, title, dateParts)
{
	var json = tsvJSON(tsv);

	console.log(json);

	var date = new Date(`${dateParts[2]}/${dateParts[0]}/${dateParts[1]}`);
	var utcDate = `${date.getUTCFullYear()}/${date.getUTCMonth()+1}/${date.getUTCDate()}`;

	console.log('Searching for item with title', title, 'on date', utcDate);

	for (var ix = 0; ix < json.length; ++ix) {
		var item = json[ix];

		if (item["Event Title"] == title && item["Event Date"] == utcDate) {
			console.log('Found item', item);

			updateCategories({
				world: getWorld(item.World),
				course: item.Course,
				laps: item.Laps == "" ? null : item.Laps,
				distance: item.Distance == "" ? null : item.Distance
			});

			return;
		}
	}

	window.alert(`Unable to locate an event with title '${title}' on date ${utcDate}`);
}

function getWorld(world) {
	switch (world) {
		case "Watopia": return 1;
		case "Richmond": return 2;
		case "London": return 3;
		case "New York": return 4;
		case "Innsbruck": return 5;
		case "Bologna": return 6;
		case "Yorkshire": return 7;
		case "Crit City": return 8;
		case "France": return 10;
		case "Paris": return 11;
		default:
			window.alert('Unable to map world');
			return -1;
	}
}

function tsvJSON(tsv){
 
	var lines=tsv.split("\n");
   
	var result = [];
   
	var headers=lines[0].split("\t");
   
	for(var i=1;i<lines.length;i++){
   
		var obj = {};
		var currentline=lines[i].split("\t");
   
		for(var j=0;j<6;j++){
			obj[headers[j]] = currentline[j];
		}
   
		result.push(obj);
   
	}
	
	return result;
  }
