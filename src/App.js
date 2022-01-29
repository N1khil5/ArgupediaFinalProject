import './App.css';
import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container } from 'react-bootstrap';
import { Graph } from "react-d3-graph";
import { evaluate } from './evaluation';
import Accordion from 'react-bootstrap/Accordion'

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			argument1: '',
			argument2: '',
			argument3: '',
			argScheme: '',
			attackRelationBoolean: false,
			addArgumentBoolean: false,
			arrayAttackRelation: [],
			nodes: [],
			links: [],
			myConfig: {
				directed: true,
				nodeHighlightBehavior: true,
				node: {
					color: "lightblue",
					size: 400,
					highlightStrokeColor: "blue",
				},
				link: {
					highlightColor: "lightblue",
				},
			}
		}
		this.localStorage = window.localStorage;
	}

	componentDidMount() {
		this.refreshArgumentChoices()
		this.refreshArgumentGraph()
		this.refreshVotingChoices()
	}

	// Refresh the argumentation graph anytime this function is called.
	refreshArgumentGraph() {
		const argu = JSON.parse(this.localStorage.getItem('arguments'));
		if (argu == null) {
			console.log("Hello")
		} else {
			const argKeys = Object.keys(argu)
			const nodes = argKeys.map(argId => {
				return { id: argId }
			});
			let links = []
			argKeys.forEach(argKey => {
				const attackRelations = argu[argKey].attackRelation
				attackRelations.forEach(attackRel => {
					const attackId = attackRel.charAt(0)
					const relType = attackRel.charAt(2)
					links.push({ source: argKey, target: attackId })
					if (relType == "c") {
						links.push({ source: attackId, target: argKey })
					}
				})
			});
			this.setState({
				nodes, links
			})
		}
	}

	// Function that is called to attach attack relations to any argument as selected in the radio buttons. 
	onAttackChoiceChange(id, choicePremiseClaim) {
		let arrayAttack = this.state.arrayAttackRelation;
		const regex = new RegExp(`^${id}.*`)
		const ifExists = arrayAttack.findIndex(attack => regex.test(attack))
		if (ifExists == -1) {
			if (choicePremiseClaim !== null) {
				arrayAttack.push(`${id}_${choicePremiseClaim}`)
			}
		} else {
			if (choicePremiseClaim == null) {
				arrayAttack.splice(ifExists, 1)
			} else {
				arrayAttack[ifExists] = `${id}_${choicePremiseClaim}`
			}
		}
		this.setState({
			arrayAttackRelation: arrayAttack
		})
	}


	// Function to refresh the voting choices anytime a new argument is added to add votes for.
	refreshVotingChoices() {
		const argu = JSON.parse(this.localStorage.getItem('arguments'));
		if (argu == null) {

		} else {
			const ids = Object.keys(argu);
			const argChoices = ids.map(id => {
				const argFile = argu[id];
				return <div class="voting">
					<Button variant="secondary" size="sm" style={{ "margin-right": "1em" }} onClick={this.onClickVote.bind(this, id)}>^</Button>
					<h5 classname="mt-2" style={{"margin-left": "1em" ,"margin-right": "1em"}}>{id}</h5>
					<h5 className="mt-2"style={{"margin-left": "1em" ,"margin-right": "1em"}}>{argFile.argument}</h5>
					<p>Votes: {argFile.votes}</p>

				</div>
			})
			this.setState({
				votingChoices: argChoices
			})
		}
	}

	// Increment the votes for the argument when the ^ button is clicked.
	onClickVote(id) {
		const argu = JSON.parse(this.localStorage.getItem('arguments'));
		let argument = argu[id]
		argument.votes = argument.votes + 1
		argu[id] = argument

		this.localStorage.setItem('arguments', JSON.stringify({
			...argu,
			[id]: argument
		}));
		this.refreshVotingChoices()
	}

	// Function to refresh the argument attack choices for each new argument added. 
	refreshArgumentChoices() {
		const argu = JSON.parse(this.localStorage.getItem('arguments'));
		if (argu == null) {

		} else {
			const ids = Object.keys(argu);
			const argChoices = ids.map(id => {
				const argFile = argu[id];
				return <Form>
					<Form.Group className="mb-3">
						<Form.Label as="legend" column sm={2}>
							Argument: {id}
						</Form.Label>
						<br></br>
						<Form.Label>
							{argFile.argument}
						</Form.Label>
						<Col sm={10}>
							<Form.Check
								onChange={this.onAttackChoiceChange.bind(this, id, null)}
								type="radio"
								label="None"
								name="formHorizontalRadios"
								id="formHorizontalRadios1"
							/>
							<Form.Check
								onChange={this.onAttackChoiceChange.bind(this, id, `p`)}
								type="radio"
								label={`Premise:  ${argFile.premise}`}
								name="formHorizontalRadios"
								id="formHorizontalRadios1"
							/>
							<Form.Check
								onChange={this.onAttackChoiceChange.bind(this, id, `c`)}
								type="radio"
								label={`Claim: ${argFile.claim}`}
								name="formHorizontalRadios"
								id="formHorizontalRadios2"
							/>
							<Form.Check
								onChange={this.onAttackChoiceChange.bind(this, id, `c`)}
								type="radio"
								label="Both Claim and Premise"
								name="formHorizontalRadios"
								id="formHorizontalRadios1"
							/>
						</Col>
					</Form.Group>
				</Form>
			})
			this.setState({
				argChoicesState: argChoices
			})
		}
	}

	// When a new argument is added, this function binds the text to be added to LocalStorage
	onArgumentChange(header, event) {
		this.setState({
			[header]: event.target.value
		})
	}

	// Toggle to add a new argument or attack arguments.
	onToggleChange(header, event) {
		this.setState({
			[header]: event
		})
	}

	// Function called when the submit button is pressed to submit the argument to LocalStorage which also refreshes the graph and voting choices.
	onButtonSubmit() {
		const a1 = document.getElementById("testControl").value.length;
		const a2 = document.getElementById("testControl2").value.length;
		const a3 = document.getElementById("testControl3").value.length;
		if (a1 == 0 || a2 == 0 || a3 == 0) {
			alert("The three fields are required, please ensure they are not null.")
		} else {
			const combinedString = `the argument is ${this.state.argument1}. The premise is ${this.state.argument2} and the claim is ${this.state.argument3}`
			this.setState({
				submittedString: combinedString
			})
			const argu = JSON.parse(this.localStorage.getItem('arguments'));

			if (argu == null) {
				this.localStorage.setItem('arguments', JSON.stringify({
					1: { argument: this.state.argument1, premise: this.state.argument2, claim: this.state.argument3, attackRelation: this.state.arrayAttackRelation, votes: 1 }
				}));
			} else {
				const ids = Object.keys(argu);
				this.localStorage.setItem('arguments', JSON.stringify({
					...argu,
					[ids.length + 1]: { argument: this.state.argument1, premise: this.state.argument2, claim: this.state.argument3, attackRelation: this.state.arrayAttackRelation, votes: 1 }
				}));
			}
		}
		this.refreshArgumentGraph();
		this.refreshVotingChoices();
	}

	// Function call to invoke the evaluation.js file to evaluate the argumentation graph.
	onClickEvaluate() {
		const winningArgs = evaluate()
		return `${winningArgs}`
	}

	// Render the front end view with the argument help, form to add arguments and form to attack arguments. 
	render() {
		return (
			<div className="App">
				<Container>
					<Row>
						<h1 className="mt-2 text-center">Argupedia</h1>
					</Row>
					<Row>
						<Accordion defaultActiveKey="2">
							<Accordion.Item eventKey="0">
								<Accordion.Header>Help with writing arguments</Accordion.Header>
								<Accordion.Body>
									Writing Arguments: <br/>
									An argument is a statement or reasoning that is for or against a fact. <br/>
									Writing premises: <br/>
									A premise of the argument is a statement that can induce the claim. <br/>
									Writing claims: <br/>
									The claim of an argument is usually the conclusion of the argument. <br/>
									<br/>
									Example: <br/>
									Argument: An expert in infectious diseases says masks are essential in reducing the spread of the Covid-19 virus.<br/>
									Premise: Masks are essential for people.<br/>
									Claim: Wearing masks can reduce the spread of the COVID-19 virus.<br/>
									Argument Scheme: Appeal From Expert Opinion<br/>
								</Accordion.Body>
							</Accordion.Item>
							<Accordion.Item eventKey="1">
								<Accordion.Header>Help with Argumentation Schemes</Accordion.Header>
								<Accordion.Body>
									This argument scheme is "Argument From Position To Know" <br/>
									Critical Questions for this scheme:<br/>
									1. Is the proponent in a position to know that the argument is true/false?<br/>
									2. Is the proponent a reliable and trustworthy source?<br/>
									3. Did the proponent assert that the argument is true/false?<br/>
									<br/>
									This argument scheme is "Argument From Expert Opinion"<br/>
									Critical Questions for this scheme:<br/>
									1. How credible is the proponent opinion as an expert?<br/>
									2. Is the proponent an expert in the domain of the argument?<br/>
									3. What did the proponent assert that implies the argument?<br/>
									4. Is the proponent reliable and trustworthy?<br/>
									5. Is the proponent's argument consistent with other expert's arguments?<br/>
									<br/>
									This argument scheme is "Appeal To Popular Opinion"<br/>
									Critical Questions for this scheme:<br/>
									1. Is there evidence that proves that the argument is true/false?<br/>
									2. Even if the argument is generally accepted, are there reasons to doubt it?<br/>
									<br/>
									This argument scheme is "Argument From Analogy"<br/>
									Critical Questions for this scheme:<br/>
									1. Is the argument true/false in case 1?<br/>
									2. Are there differences in the analogy between the two cases to undermine the argument?<br/>
									3. Is there a third case which is similar to the first case but is a counter-analogy?<br/>
									<br/>
									This argument scheme is "Argument From Correlation To Cause"<br/>
									Critical Questions for this scheme:<br/>
									1. Is there a correlation between A and B?<br/>
									2. Is the correlation anything more than a coincidence?<br/>
									3. Is there a third factor that causes the correlation?<br/>

								</Accordion.Body>
							</Accordion.Item>
						</Accordion>
					</Row>
					<Row>
						<Graph
							id="directedGraph" // id is mandatory
							data={{
								nodes: this.state.nodes,
								links: this.state.links
							}}
							config={this.state.myConfig}

						/>

					</Row>
					<Row>
						<Col>
							<Button id="evaluate" onClick={this.onClickEvaluate.bind(this)} variant="primary">Evaluate Graph</Button>
							<h5>Winning Argument: {this.onClickEvaluate(this)}</h5>  
						</Col>
					</Row>
					<Row>
						<Col>
							{this.state.votingChoices}
						</Col>
						<Col>
							<Form>
								<Form.Group classname="mb-1" controlId="test">
									<Form.Label>Select the toggle below to add an  argument</Form.Label>
									<Form.Check type="switch" id="addArgument" onChange={this.onToggleChange.bind(this, 'addArgumentBoolean', !this.state.addArgumentBoolean)} />
								</Form.Group>
							</Form>
							{this.state.addArgumentBoolean &&
								<Form>
									<Form.Group className="mb-3" controlId="testControl">
										<Form.Label>What is the argument?</Form.Label>
										<Form.Control required onChange={this.onArgumentChange.bind(this, 'argument1')} placeholder="Enter the full argument here" />
									</Form.Group>
									<Form.Group className="mb-3" controlId="testControl2">
										<Form.Label>What is the premise?</Form.Label>
										<Form.Control required onChange={this.onArgumentChange.bind(this, 'argument2')} placeholder="Enter the premise for the argument stated above" />
									</Form.Group>
									<Form.Group className="mb-3" controlId="testControl3">
										<Form.Label>What is the claim?</Form.Label>
										<Form.Control required onChange={this.onArgumentChange.bind(this, 'argument3')} placeholder="Enter the claim for the argument stated above" />
									</Form.Group>
									
									<Form.Group className="mb-3" controlId="testScheme">
										<Form.Label>What is the best scheme that the argument falls under?</Form.Label>
										<DropdownButton id="dropdown-basic-button" title="Argument Schemes">
											<Dropdown.Item >Argument From The Position To Know</Dropdown.Item>
											<Dropdown.Item >Appeal To Expert Opinion</Dropdown.Item>
											<Dropdown.Item >Appeal To Popular Opinion</Dropdown.Item>
											<Dropdown.Item >Argument From Analogy</Dropdown.Item>
											<Dropdown.Item >Argument From Correlation To Cause</Dropdown.Item>
										</DropdownButton>
									</Form.Group>
									
									<Form.Group className="mb-3" controlId="testControl4">
										<Form.Label>Select this toggle to attack other arguments</Form.Label>
										<Form.Check type="switch" id="attackRelationSwitch" onChange={this.onToggleChange.bind(this, 'attackRelationBoolean', !this.state.attackRelationBoolean)} />
									</Form.Group>

									{this.state.attackRelationBoolean &&
										this.state.argChoicesState
									}
									<Button onClick={this.onButtonSubmit.bind(this)} variant="primary">Submit</Button>{' '}
									<br />
									<br />
								</Form>
							}
						</Col>

					</Row>
				</Container>
			</div>
		)
	}
}