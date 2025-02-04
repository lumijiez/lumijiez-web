<script>
	import { onMount } from 'svelte';
	import { cubicInOut } from 'svelte/easing';
	import { fly, scale, fade } from 'svelte/transition';
	import { spring } from 'svelte/motion';
	import ArrowNoSwipe from '../components/ArrowNoSwipe.svelte';
	import ArrowSwipe from '../components/ArrowSwipe.svelte';
	import 'devicon/devicon.min.css';
	import * as Carousel from "$lib/shad/ui/carousel";
	import { Button } from "$lib/shad/ui/button";

	let currentSection = '';
	let currentIndex = 0;
	let isScrolling = false;
	let animationRunning = false;
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
			image: '/api/placeholder/600/400',
			githubLink: '#',
			liveLink: '#'
		},
		{
			title: 'Project Beta',
			description: 'AI-powered content management system with real-time collaboration',
			tech: ['Svelte', 'WebGL', 'Firebase'],
			color: 'from-violet-600/90 to-indigo-500/90',
			features: ['Real-time editing', 'AI suggestions', 'Version control'],
			image: '/api/placeholder/600/400',
			githubLink: '#',
			liveLink: '#'
		},
		{
			title: 'Project Gamma',
			description: 'Next-generation e-commerce platform with AR product visualization',
			tech: ['Next.js', 'TailwindCSS', 'Prisma'],
			color: 'from-rose-600/90 to-pink-500/90',
			features: ['AR preview', 'Instant search', 'Dynamic pricing'],
			image: '/api/placeholder/600/400',
			githubLink: '#',
			liveLink: '#'
		},
		{
			title: 'Project Delta',
			description: 'Blockchain-powered decentralized marketplace',
			tech: ['Solidity', 'Web3.js', 'React'],
			color: 'from-blue-600/90 to-purple-500/90',
			features: ['Smart contract integration', 'Secure transactions', 'Decentralized'],
			image: '/api/placeholder/600/400',
			githubLink: '#',
			liveLink: '#'
		}
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
			this.baseSpeedX = Math.random() * 2 - 1;
			this.baseSpeedY = Math.random() * 2 - 1;
			this.speedX = this.baseSpeedX;
			this.speedY = this.baseSpeedY;
		}

		update() {
			this.x += this.speedX;
			this.y += this.speedY;

			if (this.x < 0) {
				this.x = 0;
				this.speedX = Math.abs(this.speedX);
			}
			if (this.x > windowWidth) {
				this.x = windowWidth;
				this.speedX = -Math.abs(this.speedX);
			}
			if (this.y < 0) {
				this.y = 0;
				this.speedY = Math.abs(this.speedY);
			}
			if (this.y > window.innerHeight) {
				this.y = window.innerHeight;
				this.speedY = -Math.abs(this.speedY);
			}
		}

		draw() {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
			ctx.fill();
		}

		resize(oldWidth, oldHeight, newWidth, newHeight) {
			this.x = (this.x / oldWidth) * newWidth;
			this.y = (this.y / oldHeight) * newHeight;
		}
	}

	function initNeuralNetwork() {
		particles = Array.from({ length: 50 }, () =>
			new Particle(
				Math.random() * windowWidth,
				Math.random() * window.innerHeight
			)
		);
	}

	function animate() {
		if (!animationRunning) return;

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

			let oldWidth = window.innerWidth;
			let oldHeight = window.innerHeight;

			const resizeCanvas = () => {
				const newWidth = window.innerWidth;
				const newHeight = window.innerHeight;

				animationRunning = false;
				if (frame) {
					cancelAnimationFrame(frame);
				}

				canvas.width = newWidth;
				canvas.height = newHeight;

				if (particles.length > 0) {
					particles.forEach(particle => {
						particle.resize(oldWidth, oldHeight, newWidth, newHeight);
					});
				} else {
					initNeuralNetwork();
				}

				oldWidth = newWidth;
				oldHeight = newHeight;

				animationRunning = true;
				animate();
			};

			window.addEventListener('resize', resizeCanvas);

			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			initNeuralNetwork();
			animationRunning = true;
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
		class="fixed top-4 right-4 z-[60] p-2 md:hidden transition-transform"
		on:click={() => isMobileMenuOpen = !isMobileMenuOpen}
	>
		<div class="w-6 h-0.5 bg-neutral-200 mb-1.5 transition-all" style={isMobileMenuOpen ? 'transform: rotate(45deg) translate(6px, 6px)' : ''}></div>
		<div class="w-6 h-0.5 bg-neutral-200 mb-1.5 transition-all" style={isMobileMenuOpen ? 'opacity: 0' : ''}></div>
		<div class="w-6 h-0.5 bg-neutral-200 transition-all" style={isMobileMenuOpen ? 'transform: rotate(-45deg) translate(5px, -5px)' : ''}></div>
	</button>

	{#if isMobileMenuOpen}
		<div
			class="fixed inset-0 bg-black/80 menu-backdrop z-[55] md:hidden"
			transition:fade={{ duration: 200 }}
		>
			<div
				class="flex flex-col items-center justify-center h-full space-y-8"
				transition:scale={{ duration: 300, start: 0.8 }}
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

	<section id="hero" class="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] relative overflow-y-auto">
		<div class="absolute inset-0 moving-gradient"></div>

		{#if currentSection === 'hero'}
			{#if windowWidth < 768}
				<ArrowSwipe />
			{/if}
			<div class="flex flex-col justify-center text-center z-10 px-4" in:smoothScale={{duration: 1000}} out:smoothScale={{duration: 100}}>
				<div class="mb-8 relative inline-block perspective-1000" style="transform: perspective(1000px) rotateY({$mousePos.x / 500}deg) rotateX({-$mousePos.y / 50}deg)">
					<h1 class="text-5xl md:text-8xl font-bold text-neutral-50 mb-6 tracking-tight">
						{#each ['Design.', 'Create.', 'Innovate.'] as word, i}
							<span
								in:fly|global={{ y: 50, duration: 800, delay: i * 300 }}
								out:fade|global={{ duration: 100 }}
								class="inline-block mr-4 {word === 'Innovate.' ? 'gradient-text' : ''}"
							>
									{word}
							</span>
						{/each}
					</h1>
				</div>
				<p class="text-xl md:text-2xl text-neutral-300 max-w-2xl mx-auto leading-relaxed">
					{#each ['Designing', 'and', 'developing', 'things', 'that', 'actually', 'work'] as word, i}
                    <span
											in:fade|global={{ duration: 200, delay: i * 100 }}
											out:fade|global={{ duration: 100 }}
											class="inline-block mr-1"
										>
                        {word}
                    </span>
					{/each}
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
		{#if windowWidth >= 768}
			<ArrowNoSwipe />
		{/if}
	</section>

	<section id="about" class="h-screen flex items-start justify-center bg-[#0a0a0a] relative">
		<div class="w-full h-full flex items-start md:pt-6 px-4 md:px-8 overflow-y-scroll">
			{#if currentSection === 'about'}
				<div class="w-full pb-16"
						 in:fade={{duration: 800}}
						 out:fade={{duration:100}}>
					<div class="max-w-7xl mx-auto w-full">
						<div class="text-center mt-4 md:mt-0 lg:mt-4 mb-4" in:fly={{ y: 30, duration: 1000 }}>
							<h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-50 md:pb-4">
								About <span class="gradient-text">Me</span>
							</h2>
						</div>

						<div class="flex flex-col mb-6 lg:flex-row gap-6 lg:gap-8">
							<div class="glass p-6 md:p-8 rounded-2xl relative overflow-hidden transform transition-transform lg:w-1/2">
								<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent"></div>
								<h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-50 mb-6">
									<span class="gradient-text">Crafting</span> Digital Excellence
								</h2>
								<div class="space-y-4 text-neutral-300">
									<p class="text-base md:text-lg leading-relaxed"
										 in:fade={{ delay: 200, y: 20, duration: 800 }}>
										With over 5 years of experience in full-stack development, I transform complex challenges into elegant solutions that delight users and drive business growth.
									</p>
									<p class="text-base md:text-lg leading-relaxed"
										 in:fade={{ delay: 400, y: 20, duration: 800 }}>
										My approach combines technical expertise with creative innovation, ensuring every project not only meets but exceeds expectations.
									</p>
								</div>

								<div class="mt-8">
									<h3 class="text-lg font-semibold text-neutral-200 mb-3">Tech Stack</h3>
									<div class="flex flex-wrap gap-2">
										{#each [
											{ name: 'Spring', icon: 'spring' },
											{ name: 'Java', icon: 'java' },
											{ name: 'ASP.NET', icon: 'dotnetcore' },
											{ name: 'C#', icon: 'csharp' },
											{ name: 'Unity', icon: 'unity' },
											{ name: 'HTML', icon: 'html5' },
											{ name: 'CSS', icon: 'css3' },
											{ name: 'JavaScript', icon: 'javascript' },
											{ name: 'Svelte', icon: 'svelte' },
											{ name: 'React', icon: 'react' },
											{ name: 'PostgreSQL', icon: 'postgresql' },
											{ name: 'MongoDB', icon: 'mongodb' },
											{ name: 'Redis', icon: 'redis' }
										] as tech, i}
											<div
												class="px-3 py-1.5 glass rounded-full text-sm text-neutral-200 border border-neutral-700/50 hover:border-emerald-500/50 transition-all cursor-default transform hover:scale-110 hover:text-emerald-400 flex items-center gap-2"
												in:fly|global={{ delay: 100 + (i * 100), x: 20, duration: 600 }}
											>
												<i class="devicon-{tech.icon}-plain colored text-xl"></i>
												{tech.name}
											</div>
										{/each}
									</div>
								</div>
							</div>

							<div class="glass p-6 md:p-8 rounded-2xl relative overflow-hidden transform transition-transform lg:w-1/2">
								<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-transparent"></div>
								<h3 class="text-2xl font-bold text-neutral-50 mb-6 transition-colors">Key Achievements</h3>
								<div class="grid grid-cols-2 gap-6">
									{#each [
										{ title: 'Projects', value: '30+', icon: '💻' },
										{ title: 'Code Quality', value: 'Kissable', icon: '🫦' },
										{ title: 'Hackathons', value: '8', icon: '🏆' },
										{ title: 'GitHub Stars', value: '120+', icon: '⭐' }
									] as stat, i}
										<div
											class="flex flex-col items-center text-center group/stat space-y-2 p-4 border border-neutral-800 rounded-xl transition-all hover:border-neutral-700"
											in:fly|global={{ delay: 300 + (i * 200), y: 20, duration: 800 }}
										>
                    <span class="text-3xl mb-2 opacity-80 group-hover/stat:opacity-100 transition-opacity duration-300">
                      {stat.icon}
                    </span>
											<span class="text-xl font-bold text-neutral-100 group-hover/stat:text-white transition-colors duration-300">{stat.value}</span>
											<span class="text-sm text-neutral-400 group-hover/stat:text-neutral-200 transition-colors duration-300">{stat.title}</span>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<section id="skills" class="h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
		{#if currentSection === 'skills'}
			<div class="max-w-6xl w-full px-4 overflow-auto" transition:fade={{duration: 800}}>
				<h2 class="text-4xl md:text-5xl font-bold text-neutral-50 mb-12 text-center">Technical Expertise</h2>
				<div class="flex flex-wrap gap-8 justify-center">
					{#each Object.entries(skills) as [category, categorySkills], i}
						<div class="glass p-8 rounded-2xl relative overflow-hidden flex-1 min-w-[280px]" transition:fade={{delay: i * 100}}>
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

	<section id="projects" class="h-screen flex items-start justify-center bg-[#0a0a0a] relative overflow-y-auto">
		{#if currentSection === 'projects'}
			<div class="w-full h-full flex flex-col md:pt-6 pb-16 px-4 md:px-8"
					 in:fade={{duration: 800}}
					 out:fade={{duration:100}}>
				<div class="max-w-7xl mx-auto w-full flex flex-col h-full">
					<div class="text-center mt-4 md:mt-0 lg:mt-4 mb-4" in:fly={{ y: 30, duration: 1000 }}>
						<h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-50 md:pb-4">
							My <span class="gradient-text">Projects</span>
						</h2>
					</div>

					<div class="flex-grow flex flex-col justify-center">
						<div class="w-full">
							<Carousel.Root
								class="w-full"
								opts={{
           align: "start",
           loop: true,
           slidesToScroll: 1
          }}
							>
								<Carousel.Content class="-ml-4">
									{#each projects as project}
										<Carousel.Item class="pl-4 md:basis-1/2 lg:basis-1/3">
											<div class="glass rounded-2xl overflow-hidden p-4 h-full flex flex-col">
									<div class="relative aspect-video overflow-hidden mb-4">
										<div class="absolute inset-0 bg-gradient-to-br {project.color} transition-opacity"></div>
										<img
											src={project.image}
											alt={project.title}
											class="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
										/>
									</div>

									<div class="flex-grow">
										<h3 class="text-2xl font-bold text-neutral-50 mb-2">
											{project.title}
										</h3>
										<p class="text-neutral-300 mb-4 text-sm line-clamp-3">
											{project.description}
										</p>

										<div class="space-y-2 mb-4">
											<h4 class="text-sm font-semibold text-neutral-200">Key Technologies</h4>
											<div class="flex flex-wrap gap-2">
												{#each project.tech as tech}
												<span class="px-2 py-1 text-xs text-neutral-200 glass rounded-full">
													{tech}
												</span>
												{/each}
											</div>
										</div>
									</div>

									<div class="flex gap-2 mt-auto">
										<Button variant="outline" class="w-full" href={project.githubLink}>
											GitHub
										</Button>
										<Button class="w-full" href={project.liveLink}>
											Live Demo
										</Button>
									</div>
								</div>
										</Carousel.Item>
									{/each}
								</Carousel.Content>
								<Carousel.Previous class="hidden md:flex" />
								<Carousel.Next class="hidden md:flex" />
							</Carousel.Root>

							<!-- Decorative scroll arrows -->
							<div class="flex justify-center items-center gap-8 mt-8">
								<svg
									class="w-12 h-12 opacity-50"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M19 12H5M5 12L12 19M5 12L12 5"
										stroke="url(#leftArrowGradient)"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<defs>
										<linearGradient id="leftArrowGradient" x1="5" y1="5" x2="19" y2="19" gradientUnits="userSpaceOnUse">
											<stop offset="0%" stop-color="#10B981"/>
											<stop offset="100%" stop-color="#14B8A6"/>
										</linearGradient>
									</defs>
								</svg>

								<span class="text-neutral-400 text-sm">Swipe to explore projects</span>

								<svg
									class="w-12 h-12 opacity-50"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M5 12H19M19 12L12 5M19 12L12 19"
										stroke="url(#rightArrowGradient)"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<defs>
										<linearGradient id="rightArrowGradient" x1="19" y1="5" x2="5" y2="19" gradientUnits="userSpaceOnUse">
											<stop offset="0%" stop-color="#10B981"/>
											<stop offset="100%" stop-color="#14B8A6"/>
										</linearGradient>
									</defs>
								</svg>
							</div>
						</div>
					</div>
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
							<div class="glass p-6 rounded-xl group relative overflow-hidden flex-1 min-w-[200px]" transition:scale={{delay: i * 100}}>
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