import React, { PureComponent } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors, fontStyles } from '../../../../styles/common';
import PropTypes from 'prop-types';
import Identicon from '../../../UI/Identicon';
import { connect } from 'react-redux';
import { renderShortAddress } from '../../../../util/address';
import Fuse from 'fuse.js';

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: colors.white
	},
	addressElementWrapper: {
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: colors.grey050
	},
	addressElementInformation: {
		flexDirection: 'column'
	},
	addressIdenticon: {
		paddingRight: 16
	},
	addressTextNickname: {
		...fontStyles.normal,
		fontSize: 14
	},
	addressTextAddress: {
		...fontStyles.normal,
		fontSize: 12,
		color: colors.grey500
	},
	myAccountsText: {
		...fontStyles.normal,
		color: colors.blue,
		fontSize: 16
	},
	myAccountsWrapper: {
		flexGrow: 1
	},
	myAccountsTouchable: {
		borderBottomWidth: 1,
		borderBottomColor: colors.grey050,
		padding: 16
	},
	labelElementWrapper: {
		backgroundColor: colors.grey000,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: colors.grey050,
		padding: 8
	},
	labelElementText: {
		...fontStyles.normal,
		fontSize: 12,
		marginHorizontal: 8,
		color: colors.grey600
	}
});

const AddressElement = (address, nickname, onAccountPress) => (
	<TouchableOpacity
		onPress={() => onAccountPress(address)} /* eslint-disable-line */
		key={address}
		style={styles.addressElementWrapper}
	>
		<View style={styles.addressIdenticon}>
			<Identicon address={address} diameter={28} />
		</View>
		<View style={styles.addressElementInformation}>
			<Text style={styles.addressTextNickname} numberOfLines={1}>
				{nickname}
			</Text>
			<Text style={styles.addressTextAddress} numberOfLines={1}>
				{renderShortAddress(address)}
			</Text>
		</View>
	</TouchableOpacity>
);

const LabelElement = label => (
	<View key={label} style={styles.labelElementWrapper}>
		<Text style={styles.labelElementText}>{label}</Text>
	</View>
);

/**
 * View that wraps the wraps the "Send" screen
 */
class AddressList extends PureComponent {
	static propTypes = {
		/**
		 * List of accounts from the PreferencesController
		 */
		identities: PropTypes.object,
		/**
		 * Map representing the address book
		 */
		addressBook: PropTypes.object,
		inputSearch: PropTypes.string,
		/**
		 * Network id
		 */
		network: PropTypes.string,
		/**
		 * Callback called when account in address book is pressed
		 */
		onAccountPress: PropTypes.func
	};

	state = {
		myAccountsOpened: false,
		addressBookList: undefined,
		newtworkAddressBookList: undefined
	};

	list;

	componentDidMount = () => {
		const { addressBook, network } = this.props;
		const networkAddressBook = addressBook[network] || {};
		const newtworkAddressBookList = Object.keys(networkAddressBook).map(address => networkAddressBook[address]);

		this.parseAddressBook(newtworkAddressBookList);

		this.setState({ newtworkAddressBookList });

		this.fuse = new Fuse(newtworkAddressBookList, {
			shouldSort: true,
			threshold: 0.45,
			location: 0,
			distance: 10,
			maxPatternLength: 32,
			minMatchCharLength: 1,
			keys: [{ name: 'name', weight: 0.5 }, { name: 'address', weight: 0.5 }]
		});
	};

	componentDidUpdate = prevProps => {
		if (prevProps.inputSearch !== this.props.inputSearch) {
			console.log('bbbbbb', !!this.props.inputSearch);
			if (this.props.inputSearch) {
				const newtworkAddressBookList = this.fuse.search(this.props.inputSearch);
				this.parseAddressBook(newtworkAddressBookList);
			} else {
				const { addressBook, network } = this.props;
				const networkAddressBook = addressBook[network] || {};
				const newtworkAddressBookList = Object.keys(networkAddressBook).map(
					address => networkAddressBook[address]
				);
				this.parseAddressBook(newtworkAddressBookList);
			}
		}
	};

	openMyAccounts = () => {
		this.setState({ myAccountsOpened: true });
	};

	parseAddressBook = newtworkAddressBookList => {
		const { onAccountPress } = this.props;
		const list = [];

		const addressBookTree = {};
		console.log('newtworkAddressBookList', newtworkAddressBookList);

		newtworkAddressBookList = newtworkAddressBookList.sort((a, b) => a.name - b.name);

		newtworkAddressBookList.forEach(contact => {
			const initial = contact.name[0] && contact.name[0].toUpperCase();
			if (Object.keys(addressBookTree).includes(initial)) {
				addressBookTree[initial].push(contact);
			} else {
				addressBookTree[initial] = [contact];
			}
		});
		Object.keys(addressBookTree)
			.sort()
			.forEach(initial => {
				list.push(LabelElement(initial));
				addressBookTree[initial].forEach(({ address, name }) => {
					list.push(AddressElement(address, name, onAccountPress));
				});
			});
		this.setState({ addressBookList: list });
	};

	render = () => {
		const { identities, onAccountPress } = this.props;
		const { myAccountsOpened, addressBookList } = this.state;
		return (
			<View style={styles.root}>
				<ScrollView style={styles.myAccountsWrapper}>
					{!myAccountsOpened ? (
						<TouchableOpacity style={styles.myAccountsTouchable} onPress={this.openMyAccounts}>
							<Text style={styles.myAccountsText}>Transfer between my accounts</Text>
						</TouchableOpacity>
					) : (
						Object.keys(identities).map(address =>
							AddressElement(address, identities[address].name, onAccountPress)
						)
					)}
					{LabelElement('Recents')}
					{addressBookList}
				</ScrollView>
			</View>
		);
	};
}

const mapStateToProps = state => ({
	addressBook: state.engine.backgroundState.AddressBookController.addressBook,
	identities: state.engine.backgroundState.PreferencesController.identities,
	network: state.engine.backgroundState.NetworkController.network
});

export default connect(mapStateToProps)(AddressList);
