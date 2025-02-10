export const projects = [
	{
		title: 'This Website',
		description: 'Tiny yet pretty portfolio website build using SvelteKit',
		tech: ['Svelte', 'SvelteKit', 'TailwindCSS', 'NodeJS'],
		features: ['Scroll-paging', 'High mobile compat', 'Responsivity'],
		image: '/website.png',
		githubLink: 'https://github.com/lumijiez/lumijiez-web'
	},
	{
		title: 'Wirestream',
		description: 'From-scratch Java WebAPI framework, inspired by Express.js',
		tech: ['Java', 'Pure Java'],
		features: ['HTTP/S', 'WebSocket', 'Threading', 'TCP/IP', 'Middleware'],
		image: '/wirestream.png',
		githubLink: 'https://github.com/lumijiez/wirestream'
	},
	{
		title: 'Raven',
		description: 'Security-focused chat application, encrypted & tested',
		tech: ['Java', 'Spring', 'Kafka', 'Stomp', 'ECC', 'HTTPS', 'Docker', 'MongoDB', 'PostgreSQL', 'Security', 'JWT'],
		features: ['Microservice architecture', 'Scalable', 'Secure', 'Message Broker', 'MFA'],
		image: '/raven.png',
		githubLink: 'https://github.com/lumijiez/raven'
	},
	{
		title: 'Bugger',
		description: 'Immersive 2D Java/LibGDX Top-Down shooter. Clean code, appropriate design patterns, spotless performance',
		tech: ['Java', 'LibGDX', 'LWJGL'],
		features: ['Fantastic performance', 'Design patterns', 'GL shaders'],
		image: '/bugger.png',
		githubLink: 'https://github.com/lumijiez/bugger'
	},
	{
		title: 'Other projects',
		description: 'Many more projects, assignments and tasks can be found on my GitHub!',
		tech: ['Java', 'C#', 'APIs', 'etc.'],
		features: ['Fantastic performance', 'Design patterns', 'GL shaders'],
		image: '/etc.png',
		githubLink: 'https://github.com/lumijiez'
	}
];

export const sections = ['hero', 'about', 'projects', 'contact'];