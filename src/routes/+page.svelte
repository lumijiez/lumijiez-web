<script>
	import { onMount } from 'svelte';
	import { cubicInOut } from 'svelte/easing';
	import { fly, scale, fade } from 'svelte/transition';
	import { spring } from 'svelte/motion';

	let currentSection = 'hero';
	let currentIndex = 0;
	let isScrolling = false;
	let currentScrollAnimation = null;
	let mousePos = spring({ x: 0, y: 0 }, {
		stiffness: 0.1,
		damping: 0.4
	});
	let windowWidth;
	let isMobileMenuOpen = false;
	let canvas;
	let ctx;
	let particles = [];
	let frame = 0;

	const sections = ['hero', 'about', 'skills', 'projects', 'contact'];

	const skills = {
		Frontend: [
			{ name: 'React/Next.js', level: 95 },
			{ name: 'Svelte/SvelteKit', level: 90 },
			{ name: 'TypeScript', level: 88 },
			{ name: 'Three.js/WebGL', level: 85 }
		],
		Backend: [
			{ name: 'Node.js', level: 92 },
			{ name: 'Python', level: 88 },
			{ name: 'PostgreSQL', level: 85 },
			{ name: 'GraphQL', level: 82 }
		],
		DevOps: [
			{ name: 'Docker', level: 90 },
			{ name: 'AWS', level: 85 },
			{ name: 'CI/CD', level: 88 },
			{ name: 'Kubernetes', level: 80 }
		]
	};

	const projects = [
		{
			title: 'Project Alpha',
			description: 'An immersive 3D visualization platform that transforms data into interactive landscapes',
			tech: ['React', 'Three.js', 'GSAP'],
			color: 'from-emerald-600/90 to-teal-500/90',
			features: ['Real-time 3D rendering', 'Data-driven animations', 'WebGL shaders'],
			image: '/api/placeholder/600/400'
		},
		{
			title: 'Project Beta',
			description: 'AI-powered content management system with real-time collaboration',
			tech: ['Svelte', 'WebGL', 'Firebase'],
			color: 'from-violet-600/90 to-indigo-500/90',
			features: ['Real-time editing', 'AI suggestions', 'Version control'],
			image: '/api/placeholder/600/400'
		},
		{
			title: 'Project Gamma',
			description: 'Next-generation e-commerce platform with AR product visualization',
			tech: ['Next.js', 'TailwindCSS', 'Prisma'],
			color: 'from-rose-600/90 to-pink-500/90',
			features: ['AR preview', 'Instant search', 'Dynamic pricing'],
			image: '/api/placeholder/600/400'
		},
	];

	const smoothScale = (node, { delay = 0, duration = 400 }) => {
		return {
			delay,
			duration,
			css: t => {
				const eased = cubicInOut(t);
				return `
                transform: scale(${0.92 + eased * 0.08});
                opacity: ${eased};
            `;
			}
		};
	};

	function handleButtonHover(event) {
		const btn = event.currentTarget;
		const rect = btn.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const centerX = rect.width / 2;
		const centerY = rect.height / 2;
		const maxDistance = 10;
		const moveX = (x - centerX) / centerX * maxDistance;
		const moveY = (y - centerY) / centerY * maxDistance;
		btn.style.transform = `translate(${moveX}px, ${moveY}px)`;
	}

	function handleButtonLeave(event) {
		const btn = event.currentTarget;
		btn.style.transform = 'translate(0, 0)';
	}

	class Particle {
		constructor(x, y) {
			this.x = x;
			this.y = y;
			this.size = Math.random() * 1.5 + 0.5;
			this.speedX = Math.random() * 2 - 1;
			this.speedY = Math.random() * 2 - 1;
		}

		update() {
			this.x += this.speedX;
			this.y += this.speedY;
			if (this.x < 0 || this.x > windowWidth) this.speedX *= -1;
			if (this.y < 0 || this.y > window.innerHeight) this.speedY *= -1;
		}

		draw() {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	function initNeuralNetwork() {
		particles = Array.from({ length: 50 }, () =>
			new Particle(Math.random() * windowWidth, Math.random() * window.innerHeight)
		);
	}

	function animate() {
		ctx.clearRect(0, 0, windowWidth, window.innerHeight);
		particles.forEach(particle => {
			particle.update();
			particle.draw();

			particles.forEach(other => {
				const dx = particle.x - other.x;
				const dy = particle.y - other.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < 150) {
					ctx.beginPath();
					ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 * (1 - distance/150)})`;
					ctx.lineWidth = 1;
					ctx.moveTo(particle.x, particle.y);
					ctx.lineTo(other.x, other.y);
					ctx.stroke();
				}
			});
		});

		frame = requestAnimationFrame(animate);
	}

	function scrollToSection(sectionId) {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
			if (windowWidth < 768) {
				isMobileMenuOpen = false;
			}
		}
	}

	function handleScroll(event) {
		// If currently scrolling, prevent new scroll events
		if (isScrolling) {
			event.preventDefault();
			return;
		}

		let target = event.target;
		let isScrollableContainer = false;

		while (target && target !== document.documentElement) {
			const style = window.getComputedStyle(target);
			const canScrollY = style.overflowY === 'auto' || style.overflowY === 'scroll';

			if (canScrollY) {
				const canScrollUp = target.scrollTop > 0;
				const canScrollDown = target.scrollTop < target.scrollHeight - target.clientHeight;

				if ((event.deltaY < 0 && canScrollUp) || (event.deltaY > 0 && canScrollDown)) {
					isScrollableContainer = true;
					break;
				}
			}

			target = target.parentElement;
		}

		if (isScrollableContainer) return;

		const currentElement = document.getElementById(currentSection);
		if (!currentElement) return;

		const scrollTop = currentElement.scrollTop;
		const scrollHeight = currentElement.scrollHeight;
		const clientHeight = currentElement.clientHeight;
		const hasVerticalScroll = scrollHeight > clientHeight;

		if (!hasVerticalScroll ||
			(event.deltaY > 0 && Math.abs(scrollHeight - clientHeight - scrollTop) <= 1) ||
			(event.deltaY < 0 && scrollTop <= 0)) {

			event.preventDefault();

			const direction = event.deltaY > 0 ? 1 : -1;
			const newIndex = Math.min(Math.max(currentIndex + direction, 0), sections.length - 1);

			if (newIndex !== currentIndex) {
				isScrolling = true;
				currentIndex = newIndex;
				currentSection = sections[currentIndex];

				const targetElement = document.getElementById(sections[currentIndex]);
				if (targetElement) {
					targetElement.scrollIntoView({ behavior: 'smooth' });

					setTimeout(() => {
						isScrolling = false;
					}, 800);
				}
			}
		}
	}

	onMount(() => {
		document.documentElement.style.scrollBehavior = 'smooth';
		window.addEventListener('wheel', handleScroll, { passive: false });

		canvas = document.getElementById('neural-network');
		if (canvas) {
			ctx = canvas.getContext('2d');

			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;

			const resizeCanvas = () => {
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
				initNeuralNetwork();
				animate();
			};

			window.addEventListener('resize', resizeCanvas);

			initNeuralNetwork();
			animate();
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						currentSection = entry.target.id;
						currentIndex = sections.indexOf(entry.target.id);
					}
				});
			},
			{ threshold: 0.5 }
		);

		sections.forEach(section => {
			const element = document.getElementById(section);
			if (element) observer.observe(element);
		});

		return () => {
			window.removeEventListener('wheel', handleScroll);
			cancelAnimationFrame(frame);
		};
	});
</script>

<svelte:window bind:innerWidth={windowWidth} />

<style>
    :global(html) {
        scroll-snap-type: y mandatory;
        overflow-y: scroll;
        overflow-x: hidden;
    }

    :global(section) {
        scroll-snap-align: start;
        scroll-snap-stop: always;
    }

    .glass {
        background: rgba(20, 20, 20, 0.8);
        backdrop-filter: blur(12px);
    }

    .gradient-text {
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
        background-image: linear-gradient(to right, #10b981, #0ea5e9);
    }

    .moving-gradient {
        background-size: 400% 400%;
        animation: gradient 15s ease infinite;
        background-image: linear-gradient(
                -45deg,
                rgba(16, 185, 129, 0.05),
                rgba(14, 165, 233, 0.05),
                rgba(139, 92, 246, 0.05),
                rgba(236, 72, 153, 0.05)
        );
    }

    @keyframes gradient {
        0% { background-position: 0 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0 50%; }
    }

    .hover-card {
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hover-card:hover {
        transform: translateY(-10px) scale(1.02);
    }

    .skill-bar {
        transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .magnetic-button {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
</style>

<canvas id="neural-network" class="fixed inset-0 pointer-events-none" style="z-index: 1;"></canvas>

<main class="w-full relative bg-[#0a0a0a]">
	<button
		aria-label="MenuButtonMobile"
		class="fixed top-4 right-4 z-[60] p-2 rounded-full md:hidden hover:scale-110 transition-transform bg-neutral-900/50 backdrop-blur-sm"
		on:click={() => isMobileMenuOpen = !isMobileMenuOpen}
	>
		<div class="w-6 h-0.5 bg-neutral-200 mb-1.5 transition-all" style={isMobileMenuOpen ? 'transform: rotate(45deg) translate(5px, 5px)' : ''}></div>
		<div class="w-6 h-0.5 bg-neutral-200 mb-1.5" style={isMobileMenuOpen ? 'opacity: 0' : ''}></div>
		<div class="w-6 h-0.5 bg-neutral-200" style={isMobileMenuOpen ? 'transform: rotate(-45deg) translate(5px, -5px)' : ''}></div>
	</button>

	{#if isMobileMenuOpen}
		<div
			class="fixed inset-0 bg-black/80 menu-backdrop z-[55] md:hidden"
			transition:fade={{ duration: 200 }}
		>
			<div
				class="flex flex-col items-center justify-center h-full space-y-8"
				transition:scale={{ duration: 300, start: 0.95 }}
			>
				{#each sections as section}
					<a
						href="#{section}"
						class="text-2xl text-neutral-100 capitalize hover:text-emerald-400 transition-colors relative group"
						on:click={() => scrollToSection(section)}
					>
						{section}
						<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all group-hover:w-full"></span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<nav class="fixed right-8 top-1/2 -translate-y-1/2 z-50 space-y-4 hidden md:block">
		{#each sections as section}
			<a
				href="#{section}"
				class="block w-2.5 h-2.5 rounded-full transition-all duration-500 {
                    currentSection === section
                        ? 'bg-emerald-400 scale-125'
                        : 'bg-neutral-400/30 hover:bg-neutral-400/50'
                }"
				style="transform-origin: center center;"
				aria-label={section}
			></a>
		{/each}
	</nav>

	<section id="hero" class="h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-y-auto">
		<div class="absolute inset-0 moving-gradient"></div>

		{#if currentSection === 'hero'}
			<div class="text-center z-10 px-4" transition:smoothScale={{duration: 1000}}>
				<div class="mb-8 relative inline-block perspective-1000" style="transform: perspective(1000px) rotateY({$mousePos.x / 500}deg) rotateX({-$mousePos.y / 50}deg)">
					<h1 class="text-5xl md:text-8xl font-bold text-neutral-50 mb-6 tracking-tight">
						Design. Create. <span class="gradient-text">Innovate.</span>
					</h1>
				</div>
				<p class="text-xl md:text-2xl text-neutral-300 max-w-2xl mx-auto leading-relaxed">
					Crafting digital experiences that push the boundaries of what's possible
				</p>
				<div class="mt-12 flex flex-wrap justify-center gap-4">
					<button
						class="magnetic-button px-8 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium transition-all relative overflow-hidden group"
						on:mousemove={handleButtonHover}
						on:mouseleave={handleButtonLeave}
					>
						<span class="relative z-10">View Projects</span>
						<div class="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
					</button>
					<button
						class="magnetic-button px-8 py-3 rounded-full glass text-white font-medium transition-all relative overflow-hidden group"
						on:mousemove={handleButtonHover}
						on:mouseleave={handleButtonLeave}
					>
						<span class="relative z-10">Contact Me</span>
						<div class="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
					</button>
				</div>
			</div>
		{/if}
		<div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center animate-bounce z-10">
			<svg
				class="w-6 h-6 mx-auto"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M12 4L12 20M12 20L18 14M12 20L6 14"
					stroke="url(#scrollArrowGradient)"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<defs>
					<linearGradient id="scrollArrowGradient" x1="6" y1="4" x2="18" y2="20" gradientUnits="userSpaceOnUse">
						<stop offset="0%" stop-color="#10B981"/>
						<stop offset="100%" stop-color="#14B8A6"/>
					</linearGradient>
				</defs>
			</svg>
		</div>
	</section>

	<section id="about" class="h-screen flex items-start justify-center bg-[#0a0a0a] relative">
		{#if currentSection === 'about'}
			<div class="w-full h-full flex items-start overflow-y-auto pt-4 md:pt-16 pb-16 px-4 md:px-8" transition:fade={{duration: 800}}>
				<div class="max-w-7xl mx-auto w-full">
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
						<div class="glass p-6 md:p-8 rounded-2xl hover-card relative h-fit overflow-hidden">
							<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent"></div>
							<h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-50 mb-6">
								<span class="gradient-text">Crafting</span> Digital Excellence
							</h2>
							<div class="space-y-4 text-neutral-300">
								<p class="text-base md:text-lg leading-relaxed"
									 in:fly={{ delay: 200, y: 20, duration: 800 }}>
									With over 5 years of experience in full-stack development, I transform complex challenges into elegant solutions that delight users and drive business growth.
								</p>
								<p class="text-base md:text-lg leading-relaxed"
									 in:fly={{ delay: 400, y: 20, duration: 800 }}>
									My approach combines technical expertise with creative innovation, ensuring every project not only meets but exceeds expectations.
								</p>
							</div>

							<div class="mt-6">
								<h3 class="text-lg font-semibold text-neutral-200 mb-3">Tech Stack</h3>
								<div class="flex flex-wrap gap-2">
									{#each ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker'] as tech, i}
                                    <span
																			class="px-3 py-1.5 glass rounded-full text-sm text-neutral-200 border border-neutral-700/50 hover:border-emerald-500/50 transition-all cursor-default transform hover:scale-110"
																			in:fly={{ delay: 500 + (i * 100), x: 20, duration: 600 }}
																		>
                                        {tech}
                                    </span>
									{/each}
								</div>
							</div>
						</div>

						<div class="space-y-6">
							<div class="glass p-6 md:p-8 rounded-2xl hover-card relative overflow-hidden group">
								<div class="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
								<h3 class="text-2xl font-bold text-neutral-50 mb-4">Key Achievements</h3>
								<div class="space-y-4">
									{#each [
										{ title: 'Project Success Rate', value: '98%', desc: 'Consistent delivery excellence' },
										{ title: 'User Satisfaction', value: '4.9/5', desc: 'Based on client feedback' },
										{ title: 'Performance Boost', value: '300%', desc: 'Average speed improvement' }
									] as stat, i}
										<div
											class="flex items-center gap-4 group/stat"
											in:fly={{ delay: 300 + (i * 200), x: 30, duration: 800 }}
										>
											<div class="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                            <span class="text-xl md:text-2xl font-bold text-emerald-400 group-hover/stat:scale-110 transition-transform">
                                                {stat.value}
                                            </span>
											</div>
											<div>
												<h4 class="text-base md:text-lg font-medium text-neutral-200">{stat.title}</h4>
												<p class="text-xs md:text-sm text-neutral-400">{stat.desc}</p>
											</div>
										</div>
									{/each}
								</div>
							</div>

							<div class="glass p-6 md:p-8 rounded-2xl hover-card relative overflow-hidden group">
								<div class="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
								<h3 class="text-2xl font-bold text-neutral-50 mb-4">Recognition</h3>
								<div class="flex flex-wrap gap-4">
									{#each [
										{ icon: '🏆', title: 'Best Web App 2023' },
										{ icon: '🌟', title: 'Top Developer Award' },
										{ icon: '📈', title: 'Innovation Excellence' }
									] as award, i}
										<div
											class="flex items-center gap-3 group/award basis-[calc(50%-0.5rem)] md:basis-auto"
											in:fly={{ delay: 400 + (i * 200), y: 20, duration: 800 }}
										>
                                        <span class="text-xl md:text-2xl transform group-hover/award:scale-125 transition-transform">
                                            {award.icon}
                                        </span>
											<span class="text-sm md:text-base text-neutral-300">{award.title}</span>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center animate-bounce">
				<svg
					class="w-6 h-6 mx-auto"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M12 4L12 20M12 20L18 14M12 20L6 14"
						stroke="url(#scrollArrowGradient)"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<defs>
						<linearGradient id="scrollArrowGradient" x1="6" y1="4" x2="18" y2="20" gradientUnits="userSpaceOnUse">
							<stop offset="0%" stop-color="#10B981"/>
							<stop offset="100%" stop-color="#14B8A6"/>
						</linearGradient>
					</defs>
				</svg>
			</div>
		{/if}
	</section>



	<section id="skills" class="h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
		{#if currentSection === 'skills'}
			<div class="max-w-6xl w-full px-4 overflow-auto" transition:fade={{duration: 800}}>
				<h2 class="text-4xl md:text-5xl font-bold text-neutral-50 mb-12 text-center">Technical Expertise</h2>
				<div class="flex flex-wrap gap-8 justify-center">
					{#each Object.entries(skills) as [category, categorySkills], i}
						<div class="glass p-8 rounded-2xl hover-card relative overflow-hidden flex-1 min-w-[280px]" transition:fade={{delay: i * 100}}>
							<h3 class="text-2xl font-bold text-neutral-50 mb-8 relative">{category}</h3>
							<div class="space-y-6 relative">
								{#each categorySkills as skill, j}
									<div class="space-y-2 transform hover:scale-105 transition-transform">
										<div class="flex justify-between text-neutral-200">
											<span class="font-medium">{skill.name}</span>
											<span class="opacity-75">{skill.level}%</span>
										</div>
										<div class="h-2 bg-neutral-800 rounded-full overflow-hidden">
											<div class="skill-bar h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 relative" style="width: {skill.level}%">
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</section>

	<section id="projects" class="h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
		{#if currentSection === 'projects'}
			<div class="max-w-6xl w-full px-4 overflow-auto" transition:fade={{duration: 800}}>
				<h2 class="text-4xl md:text-5xl font-bold text-neutral-50 mb-12 text-center">Featured Projects</h2>
				<div class="flex flex-wrap gap-8 justify-center">
					{#each projects as project, i}
						<div class="glass rounded-2xl overflow-hidden hover-card group flex-1 min-w-[280px]" transition:smoothScale={{delay: i * 100}}>
							<div class="relative aspect-video overflow-hidden">
								<div class="absolute inset-0 bg-gradient-to-br {project.color} transition-opacity"></div>
								<img src={project.image} alt={project.title} class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
								<div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
									<button class="magnetic-button px-6 py-2 rounded-full glass text-white font-medium hover:bg-white/10 transition-all" on:mousemove={handleButtonHover} on:mouseleave={handleButtonLeave}>
										View Details
									</button>
								</div>
							</div>
							<div class="p-8">
								<h3 class="text-2xl font-bold text-neutral-50 mb-4">{project.title}</h3>
								<p class="text-neutral-300 mb-6">{project.description}</p>
								<div class="space-y-4 mb-6">
									{#each project.features as feature}
										<div class="flex items-center gap-2 text-neutral-300 group/feature">
											<div class="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover/feature:scale-150 transition-transform"></div>
											<span class="group-hover/feature:translate-x-1 transition-transform">{feature}</span>
										</div>
									{/each}
								</div>
								<div class="flex flex-wrap gap-2">
									{#each project.tech as tech}
										<span class="px-3 py-1 text-sm text-neutral-200 glass rounded-full hover:bg-white/10 transition-colors cursor-default">{tech}</span>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</section>

	<section id="contact" class="h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
		{#if currentSection === 'contact'}
			<div class="max-w-4xl w-full px-4 overflow-auto" transition:fade={{duration: 800}}>
				<div class="glass p-8 md:p-10 rounded-2xl relative">
					<h2 class="text-4xl font-bold text-neutral-50 mb-8 text-center">Let's Connect</h2>
					<div class="flex flex-wrap gap-8 mb-8 justify-center">
						{#each [
							{ title: 'Email', value: 'hello@example.com', icon: '✉️' },
							{ title: 'Location', value: 'San Francisco, CA', icon: '📍' },
							{ title: 'GitHub', value: '@username', icon: '💻' },
							{ title: 'LinkedIn', value: '@username', icon: '🔗' }
						] as contact, i}
							<div class="glass p-6 rounded-xl hover-card group relative overflow-hidden flex-1 min-w-[200px]" transition:scale={{delay: i * 100}}>
								<div class="flex items-center gap-3">
									<span class="text-2xl transform group-hover:scale-125 transition-transform">{contact.icon}</span>
									<div>
										<h3 class="text-lg font-medium text-neutral-200 mb-1">{contact.title}</h3>
										<p class="text-neutral-400 group-hover:text-neutral-200 transition-colors">{contact.value}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
					<form class="space-y-6">
						<div class="flex flex-wrap gap-6">
							<div class="space-y-2 group flex-1 min-w-[200px]">
								<label class="text-neutral-300 text-sm" for="name">Name</label>
								<input type="text" id="name" class="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" placeholder="Your name" />
							</div>
							<div class="space-y-2 group flex-1 min-w-[200px]">
								<label class="text-neutral-300 text-sm" for="email">Email</label>
								<input type="email" id="email" class="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" placeholder="your@email.com" />
							</div>
						</div>
						<div class="space-y-2 group">
							<label class="text-neutral-300 text-sm" for="message">Message</label>
							<textarea id="message" rows="4" class="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none" placeholder="Your message..."></textarea>
						</div>
						<button type="submit" class="magnetic-button w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium transition-all relative overflow-hidden group" on:mousemove={handleButtonHover} on:mouseleave={handleButtonLeave}>
							<span class="relative z-10">Send Message</span>
							<div class="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
						</button>
					</form>
				</div>
			</div>
		{/if}
	</section>
</main>