const entryTemplate = document.getElementById("entry") as HTMLTemplateElement;
const entriesEl = document.getElementById("entries")!;

async function populateEntries(): Promise<void> {
	const {
		entries,
		read
	}: { entries: Entry[]; read: string[] } = await browser.storage.local.get({
		entries: [],
		read: []
	});

	const onClick = async (e : Event, entry : Entry) => {
		// Verify that it's a valid mouse click event.
		if (e instanceof MouseEvent == false || e.button > 1) // 0 = main (left), 1 = auxiliary (middle)
			return;
		
		// Mark as read.
		read.push(entry.id);
		browser.storage.local.set({ read });

		// Only open the URL if user didn't click the "mark as read" button.
		if ((e.target as Element).className === "read")
			return;

		// Determine which type of click was used (mimicking default link-clicking behavior).
		if (e.shiftKey) {
			if (e.button === 1) // shift + middle-click
				browser.tabs.create({ url: entry.link, active: true }); // new ACTIVE tab
			else if (e.button === 0) // shift + left-click
				open(entry.link, undefined, "noreferrer"); // new window
			return;
		}
		if (e.ctrlKey || e.button === 1) { // ctrl + left-click OR middle-click w/o keys
			browser.tabs.create({ url: entry.link, active: false }); // new INACTIVE tab
			return;
		}

		// If none of the above, open URL in the current active tab.
		browser.tabs.update(undefined, { url: entry.link });
		close(); // closes the pop-up
	}

	while (entriesEl.lastChild) entriesEl.removeChild(entriesEl.lastChild);

	let unread = 0;
	for (const entry of entries) if (read.indexOf(entry.id) === -1) unread++;
	if (unread === 0) {
		const text = document.createElement("div");
		text.className = "empty";
		text.textContent = "You are all caught up!";
		entriesEl.appendChild(text);
	}

	let i = 0;
	for (const entry of entries) {
		if (i > 100) break;
		if (read.indexOf(entry.id) !== -1) continue;

		const el = document.importNode(entryTemplate.content, true);
		const entryEl = el.querySelector(".entry")!;

		el.querySelector(".icon")!.setAttribute("src", entry.icon);
		el.querySelector(".title")!.textContent = entry.title;
		el.querySelector(".author")!.textContent = entry.author;
		el.querySelector(".date")!.textContent = new Date(
			entry.date
		).toLocaleDateString();
		if (entry.thumbnail)
			el.querySelector(".thumbnail")!.setAttribute("src", entry.thumbnail);
		
		entryEl.addEventListener("click", async e => onClick(e, entry)); // triggered by left-click
		entryEl.addEventListener("auxclick", async e => onClick(e, entry)); // triggered by every other mouse button

		entriesEl.appendChild(el);
		i++;
	}
}

export { populateEntries };
