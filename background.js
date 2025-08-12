//internal settings states for commands toggles
var states = {};

//update menu item with value in states object
function updateMenu(id, check) {
	browser.menus.update(id, {
		checked: check
	});
}

function saveSession() {
	browser.storage.session.set(states);
}
function loadSession() {
	function updateState(update) {
		states = update;
	}
	return browser.storage.session.get().then(updateState);
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
	saveSession();
}

//on key command
function commands(name) {
	loadSession().then(() => {
		//set checked state for context menu
		let check = true;

		//toggle existing state in states object
		switch(name) {
			case 'docColors':
			case 'docFonts':
			case 'siteZoom':
				check = !states[name];
				break;
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
	});
}

function toggleState(tab, mouse) {
	const keys = mouse.modifiers;
	if(keys.includes('Shift') && keys.includes('Ctrl'))
		commands('animImg');
	else if(keys.includes('Shift'))
		commands('docFonts');
	else if(keys.includes('Ctrl'))
		commands('siteZoom');
	else
		commands('docColors');
}

//initial setup
function createContextMenus() {
	//create context menus
	browser.menus.create({
		id: "docColors",
		title: "Override document colors",
		type: "checkbox",
		command: "docColors",
		contexts: ["tools_menu", "action"]
	});

	browser.menus.create({
		id: "docFonts",
		title: "Override document fonts",
		type: "checkbox",
		command: "docFonts",
		contexts: ["tools_menu", "action"]
	});

	browser.menus.create({
		id: "siteZoom",
		title: "Save zoom per site",
		type: "checkbox",
		command: "siteZoom",
		contexts: ["tools_menu", "action"]
	});

	browser.menus.create({
		id: "animationSeparator",
		type: "separator",
		contexts: ["tools_menu", "action"]
	});

	browser.menus.create({
		id: "animImg",
		title: "Animate images",
		type: "radio",
		command: "animImg",
		contexts: ["tools_menu", "action"]
	});

	browser.menus.create({
		id: "animImgOnce",
		title: "Animate images once",
		type: "radio",
		command: "animImgOnce",
		contexts: ["tools_menu", "action"]
	});

	browser.menus.create({
		id: "animImgNone",
		title: "Don't animate images",
		type: "radio",
		command: "animImgNone",
		contexts: ["tools_menu", "action"]
	});
	loadSettings();
}

function loadSettings() {
	//get current browser settings
	//set internal states and update context menu to match settings
	function updateDocColors(setting) {
		states.docColors = setting.value === 'always';
		updateMenu('docColors', states.docColors);
		saveSession();
	}

	function updateDocFonts(setting) {
		//firefox uses the inverse setting
		states.docFonts = !setting.value;
		updateMenu('docFonts', states.docFonts);
		saveSession();
	}

	function updateSiteZoom(setting) {
		states.siteZoom = setting.value;
		updateMenu('siteZoom', states.siteZoom);
		saveSession();
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
		saveSession();
	}

	browser.browserSettings.overrideDocumentColors.get({}).then(updateDocColors);
	browser.browserSettings.useDocumentFonts.get({}).then(updateDocFonts);
	browser.browserSettings.zoomSiteSpecific.get({}).then(updateSiteZoom);
	browser.browserSettings.imageAnimationBehavior.get({}).then(updateAnimateImages);
}

browser.runtime.onInstalled.addListener(createContextMenus);
browser.runtime.onStartup.addListener(loadSettings);
//does not update states and menu items when user manually adjust settings
//browser.browserSettings.overrideDocumentColors.onChange.addListener(updateDocColors);
browser.action.onClicked.addListener(toggleState);
//reuse same ids for commands
browser.commands.onCommand.addListener(commands);
//event listeners for context menu items
browser.menus.onClicked.addListener(itemClicked);
