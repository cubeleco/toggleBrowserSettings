//internal settings states for commands toggles
var states = {};

//update menu item with value in states object
function updateMenu(id, check) {
	browser.menus.update(id, {
		checked: check
	});
}

//set internal states and update context menu to match settings
function updateDocColors(setting) {
	states.docColors = setting.value === 'always';
	updateMenu('docColors', states.docColors);
}

function updateDocFonts(setting) {
	//firefox uses the inverse setting
	states.docFonts = !setting.value;
	updateMenu('docFonts', states.docFonts);
}

function updateSiteZoom(setting) {
	states.siteZoom = setting.value;
	updateMenu('siteZoom', states.siteZoom);
}

function updateAnimateImages(setting) {
	states.animImg = setting.value;
	switch(setting.value) {
		case 'normal':
			updateMenu('animImg', true);
			break;
		case 'once':
			updateMenu('animImgOnce', true);
			break;
		case 'none':
			updateMenu('animImgNone', true);
			break;
	}
}

function addContextMenuItems() {
	browser.menus.create({
		id: "docColors",
		title: "Override document colors",
		type: "checkbox",
		command: "docColors",
		contexts: ["tools_menu"]
	});

	browser.menus.create({
		id: "docFonts",
		title: "Override document fonts",
		type: "checkbox",
		command: "docFonts",
		contexts: ["tools_menu"]
	});

	browser.menus.create({
		id: "siteZoom",
		title: "Save zoom per site",
		type: "checkbox",
		command: "siteZoom",
		contexts: ["tools_menu"]
	});

	browser.menus.create({
		id: "animationSeparator",
		type: "separator",
		contexts: ["tools_menu"]
	});

	browser.menus.create({
		id: "animImg",
		title: "Animate images",
		type: "radio",
		command: "animImg",
		contexts: ["tools_menu"]
	});

	browser.menus.create({
		id: "animImgOnce",
		title: "Animate images once",
		type: "radio",
		command: "animImgOnce",
		contexts: ["tools_menu"]
	});

	browser.menus.create({
		id: "animImgNone",
		title: "Don't animate images",
		type: "radio",
		command: "animImgNone",
		contexts: ["tools_menu"]
	});
}

//on key command
function commands(name) {
	//set checked state for context menu
	let check = true;

	//toggle existing state in states object
	switch(name) {
		case 'docColors':
		case 'docFonts':
		case 'siteZoom':
			check = !states[name];
			break;
			//use default as inverse. will be inverted in itemClicked()
			//check = states[name];
			//break;
		case 'animImg':
			//reset all radio items
			updateMenu('animImg', false);
			updateMenu('animImgOnce', false);
			updateMenu('animImgNone', false);

			//use default check true for radio buttons
			//change name to match menu item id
			name = (states.animImg === 'normal') ? 'animImgNone' : 'animImg'; 
			break;
	}

	//ids are the same reuse itemClicked to change settings
	itemClicked({
		menuItemId: name,
		checked: check
	});
	//update context menu
	updateMenu(name, check);
}

function itemClicked(item) {
	switch(item.menuItemId) {
		case 'docColors':
			states.docColors = item.checked;
			browser.browserSettings.overrideDocumentColors.set({
				value: item.checked? 'always' : 'never'
			});
			break;
		case 'docFonts':
			states.docFonts = item.checked;
			browser.browserSettings.useDocumentFonts.set({
				//firefox uses the inverse setting
				value: !item.checked
			});
			break;
		case 'siteZoom':
			states.siteZoom = item.checked;
			browser.browserSettings.zoomSiteSpecific.set({
				value: states.siteZoom
			});
			break;
		case 'animImg':
			states.animImg = 'normal';
			browser.browserSettings.imageAnimationBehavior.set({
				value: states.animImg
			});
			break;
		case 'animImgOnce':
			states.animImg = 'once';
			browser.browserSettings.imageAnimationBehavior.set({
				value: states.animImg
			});
			break;
		case 'animImgNone':
			states.animImg = 'none';
			browser.browserSettings.imageAnimationBehavior.set({
				value: states.animImg
			});
			break;
	}
	console.log(states, item);
}


//get current browser settings
function getSettings() {
	browser.browserSettings.overrideDocumentColors.get({}).then(updateDocColors);
	browser.browserSettings.useDocumentFonts.get({}).then(updateDocFonts);
	browser.browserSettings.zoomSiteSpecific.get({}).then(updateSiteZoom);
	browser.browserSettings.imageAnimationBehavior.get({}).then(updateAnimateImages);
}

//create context menus
addContextMenuItems();
//then update menu items based on settings
getSettings();

//event listeners for context menu items
browser.menus.onClicked.addListener(itemClicked);
//does not update states and menu items when user manually adjust settings
//browser.browserSettings.overrideDocumentColors.onChange.addListener(updateDocColors);
//reuse same ids for commands
browser.commands.onCommand.addListener(commands);
