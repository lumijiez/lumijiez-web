<script>
	import { onMount } from 'svelte';
	import { cubicInOut } from 'svelte/easing';
	import { fly, scale, fade } from 'svelte/transition';
	import { spring } from 'svelte/motion';
	import ArrowNoSwipe from '../components/ArrowNoSwipe.svelte';
	import ArrowSwipe from '../components/ArrowSwipe.svelte';
	import { projects, sections } from '$lib/data';
	import 'devicon/devicon.min.css';
	import * as Carousel from "$lib/shad/ui/carousel";
	import { Button } from "$lib/shad/ui/button";

	let currentSection = '';
	let currentIndex = 0;
	let isScrolling = false;
	let animationRunning = false;
	let mousePos = spring({ x: 0, y: 0 }, { stiffness: 0.1, damping: 0.4 });
	let isMobileMenuOpen = false;
	let canvas, ctx, windowWidth;
	let particles = [];
	let frame = 0;

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
    :root {
        scrollbar-width: thin;
        scrollbar-color: #10b981 rgba(20, 20, 20, 0.8);
    }

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

    .magnetic-button {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    *,
    *:before,
    *:after {
        scrollbar-width: thin;
        scrollbar-color: #10b981 rgba(20, 20, 20, 0.8);
    }

    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    ::-webkit-scrollbar-track {
        background: rgba(20, 20, 20, 0.8);
        backdrop-filter: blur(12px);
    }

    ::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #10b981, #0ea5e9);
        border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(to bottom, #059669, #0284c7);
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
				<div class="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-12 mb-8">
					<div class="relative group perspective-1000" style="transform: perspective(1000px) rotateY({$mousePos.x / 500}deg) rotateX({-$mousePos.y / 50}deg)">
						<div class="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-emerald-500/50 transition-all duration-500 group-hover:scale-105 group-hover:border-emerald-500">
							<img
								src="/profile.jpg"
								alt="Daniel Schipschi"
								class="w-full h-full object-cover object-top grayscale hover:grayscale-0 transition-all duration-500"
							/>
						</div>
						<div class="absolute -inset-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl opacity-50 -z-10"></div>
					</div>

					<div class="text-center md:text-left">
						<h1 class="text-5xl md:text-6xl font-bold text-neutral-50 mb-4 tracking-tight">
							<span>Hi, I'm </span>
							<span class="gradient-text">Daniel</span>
						</h1>
						<div class="mb-4">
							{#each [
								{ text: 'Design.', special: false },
								{ text: 'Create.', special: false },
								{ text: 'Innovate.', special: true }
							] as word, i}
							<span
								in:fly|global={{ y: 50, duration: 800, delay: i * 300 }}
								out:fade|global={{ duration: 100 }}
								class="inline-block mr-4 text-3xl md:text-4xl {word.special ? 'gradient-text font-bold' : 'text-white font-bold'}"
							>
								{word.text}
							</span>
							{/each}
						</div>
						<p class="text-xl md:text-2xl text-neutral-300 max-w-2xl mx-auto md:mx-0 leading-relaxed">
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
					</div>
				</div>

				<div class="flex flex-wrap justify-center gap-4">
					<button
						class="magnetic-button px-8 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium transition-all relative overflow-hidden group"
						on:mousemove={handleButtonHover}
						on:mouseleave={handleButtonLeave}
						on:click={() => scrollToSection('projects')}
					>
						<span class="relative z-10">View Projects</span>
						<div class="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
					</button>
					<button
						class="magnetic-button px-8 py-3 rounded-full glass text-white font-medium transition-all relative overflow-hidden group"
						on:mousemove={handleButtonHover}
						on:mouseleave={handleButtonLeave}
						on:click={() => scrollToSection('contact')}
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
						<div class="text-center mt-4 md:mt-0 lg:mt-4 mb-6" in:fly={{ y: 30, duration: 1000 }}>
							<h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-50 md:pb-4">
								About <span class="gradient-text">Me</span>
							</h2>
						</div>

						<div class="grid md:grid-cols-2 gap-8">
							<div class="relative md:h-full" in:fly|global={{ x: -50, duration: 800, delay: 200 }}>
								<div class="absolute -inset-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-50"></div>
								<div class="overflow-hidden relative z-10 glass p-8 rounded-3xl border border-neutral-800/50 transform transition-all duration-500 h-full flex flex-col">
									<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent"></div>

									<h3 class="text-3xl font-bold mb-6 text-neutral-50" in:fly|global={{ y: 20, duration: 600, delay: 400 }}>
										<span class="gradient-text">Crafting</span> Digital Excellence
									</h3>

									<div class="space-y-4 text-neutral-300 flex-grow flex flex-col justify-center">
										{#each [
											"I'm passionate about coding and creating meaningful digital experiences. As a student, I'm constantly learning and experimenting with different technologies to bring creative ideas to life.",
											"Every project is a new learning opportunity for me. I love diving deep into technical challenges, finding innovative solutions, and seeing my skills grow with each line of code I write.",
											"While I'm still early in my journey, I put my heart into every project - from the initial concept to the final deployment. I believe in writing clean code and creating applications that are both functional and user-friendly."
										] as paragraph, i}
											<p class="leading-relaxed text-base md:text-lg"
												 in:fly|global={{ y: 20, duration: 600, delay: 600 + (i * 200) }}>
												{paragraph}
											</p>
										{/each}
									</div>
								</div>
							</div>

							<div class="flex flex-col justify-between space-y-8 md:h-full">
								<div class="overflow-hidden glass p-8 rounded-3xl border border-neutral-800/50 transform transition-all duration-500 relative flex-1"
										 in:fly|global={{ x: 50, duration: 800, delay: 400 }}>
									<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-transparent"></div>
									<h3 class="text-2xl font-bold text-neutral-50 mb-6"
											in:fly|global={{ y: 20, duration: 600, delay: 600 }}>
										Tech Constellation
									</h3>
									<div class="flex flex-wrap gap-3">
										{#each [
											{ name: 'Spring', icon: 'spring', color: 'text-green-500' },
											{ name: 'Java', icon: 'java', color: 'text-red-500' },
											{ name: 'C#', icon: 'csharp', color: 'text-purple-500' },
											{ name: 'Unity', icon: 'unity', color: 'text-black' },
											{ name: 'Svelte', icon: 'svelte', color: 'text-orange-500' },
											{ name: 'React', icon: 'react', color: 'text-blue-400' }
										] as tech, i}
											<div class="group relative"
													 in:fly|global={{ y: 20, x: 20, duration: 600, delay: 800 + (i * 100) }}>
												<i class="devicon-{tech.icon}-plain colored text-4xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-6 {tech.color}"></i>
												<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-xs text-neutral-300 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                {tech.name}
                                            </span>
											</div>
										{/each}
									</div>
								</div>

								<div class="flex flex-col flex-1">
									<div class="glass p-8 rounded-3xl border border-neutral-800/50 transform transition-all duration-500 relative overflow-hidden h-full"
											 in:fly|global={{ x: 50, duration: 800, delay: 600 }}>
										<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-transparent"></div>
										<h3 class="text-2xl font-bold text-neutral-50 mb-6"
												in:fly|global={{ y: 20, duration: 600, delay: 800 }}>
											Impact Metrics
										</h3>
										<div class="grid grid-cols-2 gap-4">
											{#each [
												{ title: 'Projects', value: '30+', icon: '💻', gradient: 'from-emerald-400/10 to-teal-400/10' },
												{ title: 'Code Quality', value: 'Pristine', icon: '🔬', gradient: 'from-violet-400/10 to-purple-400/10' },
												{ title: 'Hackathons', value: '8', icon: '🎪', gradient: 'from-pink-400/10 to-rose-400/10' },
												{ title: 'GitHub Stars', value: '120+', icon: '⭐', gradient: 'from-blue-400/10 to-indigo-400/10' }
											] as stat, i}
												<div class="relative overflow-hidden backdrop-blur-xl border border-white/10 bg-gradient-to-br {stat.gradient} p-4 rounded-xl text-center transform transition-all duration-500 group"
														 in:fly|global={{ y: 20, duration: 600, delay: 1000 + (i * 200) }}>
													<div class="absolute inset-0 bg-white/5 opacity-0 transition-opacity duration-300"></div>
													<div class="relative z-10">
														<div class="text-3xl mb-2 opacity-80 transform transition-transform duration-300">{stat.icon}</div>
														<div class="text-xl font-bold text-white/90">{stat.value}</div>
														<div class="text-sm text-white/70">{stat.title}</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
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
													<div class="absolute inset-0 bg-gradient-to-br transition-opacity"></div>
														<img
															src={project.image}
															alt={project.title}
															loading="lazy"
															class="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700 max-h-[500px]"
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
												</div>
											</div>
										</Carousel.Item>
									{/each}
								</Carousel.Content>
								<Carousel.Previous class="hidden md:flex" />
								<Carousel.Next class="hidden md:flex" />
							</Carousel.Root>

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

	<section id="contact" class="h-screen flex items-start justify-center bg-[#0a0a0a] relative overflow-y-auto">
		{#if currentSection === 'contact'}
			<div class="w-full h-full flex flex-col md:pt-6 pb-16 px-4 md:px-8"
					 in:fade={{duration: 800}}
					 out:fade={{duration:100}}>
				<div class="max-w-7xl mx-auto w-full flex flex-col h-full">
					<div class="text-center mt-4 md:mt-0 lg:mt-4 mb-6" in:fly={{ y: 30, duration: 1000 }}>
						<h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-50 md:pb-6 sm:pb-6">
							Let's <span class="gradient-text">Connect</span>
						</h2>
					</div>

					<div class="flex-grow flex flex-col justify-center">
						<div class="grid md:grid-cols-2 gap-8 mb-6">

							<div class="flex flex-col justify-between space-y-8" in:fly|global={{ x: 50, duration: 800, delay: 400 }}>
								<div class="overflow-hidden glass p-8 rounded-3xl border border-neutral-800/50 transform transition-all duration-500 hover:border-violet-500/30 relative flex-1">
									<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-transparent"></div>
									<h3 class="text-2xl font-bold text-neutral-50 mb-6">
										Social Channels
									</h3>
									<div class="grid grid-cols-2 gap-4">
										<a href="https://github.com/lumijiez" target="_blank"
											 class="group relative p-4 text-center glass rounded-xl hover:border-emerald-500/30 border border-transparent transition-all duration-300"
											 in:fly|global={{ y: 20, x: 20, duration: 600, delay: 800 }}>
											<i class="devicon-github-plain text-4xl text-white transition-all duration-300 group-hover:scale-125 group-hover:rotate-6"></i>
											<span class="block mt-2 text-neutral-300 group-hover:text-white transition-colors">
												GitHub
											</span>
										</a>

										<a href="https://www.linkedin.com/in/lumijiez/" target="_blank"
											 class="group relative p-4 text-center glass rounded-xl hover:border-emerald-500/30 border border-transparent transition-all duration-300"
											 in:fly|global={{ y: 20, x: 20, duration: 600, delay: 900 }}>
											<i class="devicon-linkedin-plain text-4xl text-blue-500 transition-all duration-300 group-hover:scale-125 group-hover:rotate-6"></i>
											<span class="block mt-2 text-neutral-300 group-hover:text-white transition-colors">
												LinkedIn
											</span>
										</a>

										<a href="https://instagram.com/lumijiez" target="_blank"
											 class="group relative p-4 text-center glass rounded-xl hover:border-emerald-500/30 border border-transparent transition-all duration-300"
											 in:fly|global={{ y: 20, x: 20, duration: 600, delay: 1000 }}>
											<img src="/insta.png" alt="Instagram" class="w-10 h-10 mx-auto text-4xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-6"/>
											<span class="block mt-2 text-neutral-300 group-hover:text-white transition-colors">
												Instagram
											</span>
										</a>

										<a href="/cv.pdf" target="_blank"
											 class="group relative p-4 text-center glass rounded-xl hover:border-emerald-500/30 border border-transparent transition-all duration-300"
											 in:fly|global={{ y: 20, x: 20, duration: 600, delay: 1100 }}>
												<span class="text-4xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-6">
													📄
												</span>
												<span class="block mt-2 text-neutral-300 group-hover:text-white transition-colors">
													Download CV
												</span>
										</a>
									</div>
								</div>
							</div>

							<div class="glass rounded-3xl p-8 border border-neutral-800/50 relative overflow-hidden group" in:fly|global={{ x: 50, duration: 800, delay: 400 }}>
								<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-transparent"></div>
								<div class="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

								<div class="relative z-10">
									<h3 class="text-2xl font-bold text-neutral-50 mb-4">Quick Info</h3>
									<div class="space-y-4">
										<div>
											<p class="text-neutral-400">Location</p>
											<p class="text-neutral-100">Chisinau, Moldova</p>
										</div>
										<div>
											<p class="text-neutral-400">Email</p>
											<p class="text-neutral-100">daniil.schipschi@isa.utm.com</p>
										</div>
										<div>
											<p class="text-neutral-400">Availability</p>
											<p class="text-emerald-400">Open to Work/Internships</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</section>
</main>